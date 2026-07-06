"use node";

import { v } from "convex/values";
import type { Sandbox } from "@daytonaio/sdk";
import { action, internalAction } from "../_generated/server";
import { api, internal } from "../_generated/api";
import { FALLBACK_GIT_BASE_BRANCH } from "@conductor/shared";
import { getAIModelProvider, normalizeAIModel } from "../validators";
import {
  exec,
  resolveSandboxContext,
  getSandbox,
  ensureSandboxRunning,
  ARCHIVED_SANDBOX_READY_TIMEOUT_SECONDS,
  sleep,
  errorMessage,
  signAndLaunchScript,
} from "./helpers";
import { CALLBACK_SCRIPT_FINGERPRINT } from "./callbackScriptFingerprint";
import { uploadCallbackScriptBundle } from "./launch";
import { isDaytonaNetworkIssue } from "../_taskWorkflow/recovery";
import {
  fetchOrigin,
  setupBranch,
  checkoutFetchedBaseBranch,
  createSandboxAndPrepareRepo,
  getOrCreateSandbox,
  pushBranchToOrigin,
  EPHEMERAL_LIFECYCLE,
  SESSION_LIFECYCLE,
} from "./git";
import { ensureSessionPersistenceVolumes, sessionClaudeUuid } from "./volumes";
import { startDesktopWithChrome } from "./desktop";
import { ensurePreviewNavigationProxy } from "./previewProxy";
import { getPreviewGrantPublicJwk, signPreviewGrant } from "../previewGrant";
import { PREVIEW_GRANT_PARAM } from "../previewGrantConfig";
import { restoreSeededRuntimeState as restoreSeededRuntimeStateInSandbox } from "./devServer";

const sessionPersistenceKindValidator = v.union(
  v.literal("sessions"),
  v.literal("designSessions"),
  v.literal("projects"),
  v.literal("agentTasks"),
);

const sessionPersistenceIdValidator = v.union(
  v.id("sessions"),
  v.id("designSessions"),
  v.id("projects"),
  v.id("agentTasks"),
);

/** Checks whether a sandbox is healthy, starting it if stopped. */
export const validateSandbox = internalAction({
  args: {
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
  },
  returns: v.object({ healthy: v.boolean() }),
  handler: async (ctx, args) => {
    try {
      const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);
      // Start the sandbox if it's stopped (fast resume ~3-5s)
      await ensureSandboxRunning(sandbox, {
        timeoutSeconds: ARCHIVED_SANDBOX_READY_TIMEOUT_SECONDS,
      });
      return { healthy: true };
    } catch (e) {
      console.error("Sandbox validation failed:", e);
      return { healthy: false };
    }
  },
});

/** Executes a shell command on a sandbox and returns the output. */
export const runSandboxCommand = internalAction({
  args: {
    sandboxId: v.string(),
    command: v.string(),
    timeoutSeconds: v.optional(v.number()),
    repoId: v.id("githubRepos"),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);
    return (
      await exec(sandbox, args.command, args.timeoutSeconds ?? 30)
    ).trim();
  },
});

/** Returns whether startup commands have already completed on this sandbox. */
export const startupCommandsMarkerExists = internalAction({
  args: {
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
  },
  returns: v.boolean(),
  handler: async (ctx, args): Promise<boolean> => {
    const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);
    try {
      await exec(sandbox, "test -f /tmp/.startup-commands-done", 5);
      return true;
    } catch {
      return false;
    }
  },
});

/** Restores service state exported into a seeded snapshot before services boot. */
export const restoreSeededRuntimeState = internalAction({
  args: {
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);
    await restoreSeededRuntimeStateInSandbox(sandbox);
    return null;
  },
});

/** Runs startup commands on a sandbox if configured. Returns success status. */
export const runStartupCommands = internalAction({
  args: {
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
    // When true, skip the marker file check and re-run commands even if they
    // previously ran. Used by the retry flow to recover from failed runs.
    force: v.optional(v.boolean()),
  },
  returns: v.object({
    ran: v.boolean(),
    commandCount: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{ ran: boolean; commandCount: number; errors: string[] }> => {
    // Get startup commands for this repo
    const commands: string[] | null = await ctx.runQuery(
      internal.repoSnapshots.getStartupCommands,
      { repoId: args.repoId },
    );

    if (!commands || commands.length === 0) {
      return { ran: false, commandCount: 0, errors: [] };
    }

    const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);

    if (!args.force) {
      // Check if startup commands have already run (marker file)
      try {
        await exec(sandbox, "test -f /tmp/.startup-commands-done", 5);
        // Marker exists, commands already ran
        console.log(
          `[daytona] runStartupCommands: marker exists, skipping ${commands.length} commands`,
        );
        return { ran: false, commandCount: 0, errors: [] };
      } catch {
        // Marker doesn't exist, proceed
      }
    }

    console.log(
      `[daytona] runStartupCommands: executing ${commands.length} startup command(s)${args.force ? " (forced)" : ""}`,
    );

    const errors: string[] = [];
    for (const command of commands) {
      console.log(`[daytona] runStartupCommands: running: ${command}`);
      try {
        // 10 minute timeout per command (supabase start can take a while)
        const output = await exec(sandbox, command, 600);
        console.log(`[daytona] runStartupCommands: completed: ${command}`);
        if (output.trim()) {
          console.log(`[daytona] output: ${output.slice(0, 500)}`);
        }
      } catch (e) {
        const msg = errorMessage(e, "command failed");
        console.error(`[daytona] runStartupCommands: failed: ${command}`, msg);
        errors.push(`${command}: ${msg}`);
        // Continue with other commands even if one fails
      }
    }

    // Create the marker only when every command succeeded. Writing it after a
    // failed run permanently branded the sandbox as seeded: every resume then
    // marker-skipped the seed and the DB stayed empty forever. Leaving the
    // marker absent lets the next resume retry the full startup sequence.
    if (errors.length === 0) {
      try {
        await exec(sandbox, "touch /tmp/.startup-commands-done", 5);
      } catch {
        // Non-fatal
      }
    } else {
      console.error(
        `[daytona] runStartupCommands: ${errors.length}/${commands.length} command(s) failed — NOT writing marker so the next resume retries`,
      );
    }

    return { ran: true, commandCount: commands.length, errors };
  },
});

/**
 * Launches background commands (long-running daemons like `npx convex dev`) on
 * a sandbox. Each command is detached via `nohup ... > /tmp/bg-<idx>.log 2>&1 &`
 * so the shell forks immediately without waiting for the daemon to exit.
 *
 * Unlike `runStartupCommands`, there is **no marker file** — daemons die when
 * the sandbox stops, so we always re-run on resume to respawn them. Mirrors
 * the dev-server launch idiom used elsewhere in this file.
 */
export const runBackgroundCommands = internalAction({
  args: {
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
  },
  returns: v.object({
    ran: v.boolean(),
    commandCount: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{ ran: boolean; commandCount: number; errors: string[] }> => {
    const commands: string[] | null = await ctx.runQuery(
      internal.repoSnapshots.getBackgroundCommands,
      { repoId: args.repoId },
    );

    if (!commands || commands.length === 0) {
      return { ran: false, commandCount: 0, errors: [] };
    }

    const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);

    console.log(
      `[daytona] runBackgroundCommands: launching ${commands.length} background command(s)`,
    );

    const errors: string[] = [];
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      const logPath = `/tmp/bg-${i}.log`;
      // Escape single quotes for the bash -lc payload.
      // Write the command to a script file and launch THAT, rather than
      // inlining it via `bash -lc '<command>'`: the inline form puts the whole
      // command text into the wrapper shell's cmdline, so a user guard like
      // `pgrep -f "[c]onvex dev" || npx convex dev` matches its own wrapper
      // (the unguarded "npx convex dev" launch text) and silently never starts
      // the daemon. With a script file the cmdline is just the file path.
      // Base64 transport also makes user quoting unbreakable.
      const cb64 = Buffer.from(command, "utf8").toString("base64");
      // setsid + </dev/null fully detaches the daemon into its own session, so
      // it survives the exec session teardown even when the user's command
      // self-backgrounds. A trailing `&` would otherwise let bash -lc exit
      // immediately, letting a process-group SIGTERM reach the daemon (nohup
      // only blocks SIGHUP).
      const launchCmd = `echo ${cb64} | base64 -d > /tmp/bg-cmd-${i}.sh && chmod +x /tmp/bg-cmd-${i}.sh && (setsid nohup bash -l /tmp/bg-cmd-${i}.sh </dev/null > ${logPath} 2>&1 & echo $! > /tmp/bg-${i}.pid) && echo LAUNCHED`;
      console.log(
        `[daytona] runBackgroundCommands: launching: ${command} (log: ${logPath})`,
      );
      try {
        // Short timeout — we only wait for the shell to fork the daemon.
        await exec(sandbox, launchCmd, 10);
      } catch (e) {
        const msg = errorMessage(e, "command failed");
        console.error(
          `[daytona] runBackgroundCommands: failed to launch: ${command}`,
          msg,
        );
        errors.push(`${command}: ${msg}`);
      }
    }

    return { ran: true, commandCount: commands.length, errors };
  },
});

/**
 * Runs a repo's clean-stop commands (e.g. `supabase stop`, `pkill convex dev`)
 * sequentially, foreground, so on-disk volumes flush before a filesystem
 * snapshot. Used only by the seeded-snapshot build; never on normal starts.
 * Non-fatal per command so a partial stop still lets the snapshot proceed.
 */
export const runStopCommands = internalAction({
  args: {
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
  },
  returns: v.object({
    ran: v.boolean(),
    commandCount: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{ ran: boolean; commandCount: number; errors: string[] }> => {
    const commands: string[] | null = await ctx.runQuery(
      internal.repoSnapshots.getStopCommands,
      { repoId: args.repoId },
    );

    if (!commands || commands.length === 0) {
      return { ran: false, commandCount: 0, errors: [] };
    }

    const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);

    console.log(
      `[daytona] runStopCommands: running ${commands.length} stop command(s)`,
    );

    const errors: string[] = [];
    for (const command of commands) {
      console.log(`[daytona] runStopCommands: running: ${command}`);
      try {
        await exec(sandbox, command, 300);
        console.log(`[daytona] runStopCommands: completed: ${command}`);
      } catch (e) {
        const msg = errorMessage(e, "command failed");
        console.error(`[daytona] runStopCommands: failed: ${command}`, msg);
        errors.push(`${command}: ${msg}`);
      }
    }

    return { ran: true, commandCount: commands.length, errors };
  },
});

/** Returns a signed preview URL for a sandbox port, optionally checking readiness. */
export const getPreviewUrl = action({
  args: {
    sandboxId: v.string(),
    port: v.number(),
    checkReady: v.optional(v.boolean()),
    navigationSync: v.optional(v.boolean()),
    repoId: v.id("githubRepos"),
  },
  returns: v.object({
    url: v.string(),
    port: v.number(),
    ready: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Authorize: the caller must have access to the repo this sandbox belongs to.
    // `githubRepos.get` returns the repo only for the connector or a team member,
    // otherwise null — so a null result means the user is not allowed to preview it.
    const repo = await ctx.runQuery(api.githubRepos.get, { id: args.repoId });
    if (!repo) {
      throw new Error("Not authorized to access this repository");
    }

    const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);
    let ready = true;
    if (args.checkReady) {
      try {
        const result = await exec(
          sandbox,
          `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:${args.port}`,
          3,
        );
        const code = parseInt(result.trim() || "0", 10);
        ready = code >= 200 && code < 500;
      } catch {
        ready = false;
      }
    }

    // Always front the dev server with the in-sandbox proxy (not just when
    // navigationSync is set) so the auth gate covers every preview surface —
    // dev server, code-server editor, VNC desktop, design preview. When no
    // grant key is configured the proxy runs in legacy pass-through mode.
    // `navigationSync` now only decides whether the HTML nav-sync script is
    // injected.
    const previewPublicJwk = getPreviewGrantPublicJwk();
    let signedPort = args.port;
    if (ready) {
      try {
        signedPort = await ensurePreviewNavigationProxy(sandbox, args.port, {
          publicKeyJwk: previewPublicJwk,
          sandboxId: args.sandboxId,
          repoId: args.repoId,
          webAppUrl: process.env.WEB_APP_URL ?? "",
          inject: args.navigationSync === true,
        });
      } catch (e) {
        console.warn(
          `[daytona] preview navigation proxy unavailable for sandbox=${args.sandboxId} port=${args.port}: ${errorMessage(e, "proxy startup failed")}`,
        );
      }
    }

    const signedPreview = await sandbox.getSignedPreviewUrl(signedPort, 86400);
    const parsedUrl = new URL(signedPreview.url);
    parsedUrl.protocol = "https:";

    // Append a fresh short-lived grant so the in-app iframe (and the authed
    // user's "open in new tab") loads without a login round-trip. The proxy
    // exchanges it for a session cookie on first load. Only when gating is
    // configured — otherwise the URL stays a plain proxied URL.
    if (previewPublicJwk && ready) {
      const grant = await signPreviewGrant({
        sandboxId: args.sandboxId,
        port: args.port,
        sub: identity.subject,
      });
      parsedUrl.searchParams.set(PREVIEW_GRANT_PARAM, grant);
    }

    const url = parsedUrl.toString();
    return { url, port: args.port, ready };
  },
});

const MAX_SETUP_ELAPSED_MS = 8 * 60 * 1000;
const QUICK_TASK_MAX_TOTAL_RUNTIME_MS = "5400000";

/** Checks if a sandbox setup error is transient and worth retrying. */
function isSandboxSetupRetryable(message: string): boolean {
  if (isDaytonaNetworkIssue(message)) {
    return true;
  }
  const lowered = message.toLowerCase();
  const gitNetworkMarkers = [
    "status code 502",
    "status code 503",
    "status code 504",
    "fetch failed",
    "gnutls recv error",
    "tls connection was non-properly terminated",
    "remote end hung up unexpectedly",
    "http/2 stream",
    "early eof",
    "connection reset by peer",
    "rpc failed",
  ];
  return (
    (lowered.includes("sandbox exec") && lowered.includes("timed out")) ||
    lowered.includes("command execution timeout") ||
    // Daytona returns exit code -1 when the command was terminated abnormally
    // (sandbox not yet accepting commands, transport error, killed mid-exec) —
    // this is transient, unlike non-zero exit codes from real command failures.
    lowered.includes("sandbox command failed with exit code -1") ||
    gitNetworkMarkers.some((marker) => lowered.includes(marker))
  );
}

/** Creates or resumes a sandbox with local branch setup, desktop, and retry logic. */
export const prepareSandbox = internalAction({
  args: {
    existingSandboxId: v.optional(v.string()),
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.optional(v.string()),
    baseBranch: v.optional(v.string()),
    ephemeral: v.optional(v.boolean()),
    repoId: v.id("githubRepos"),
    attachRunId: v.optional(v.id("agentRuns")),
    sessionPersistenceId: v.optional(sessionPersistenceIdValidator),
    sessionPersistenceKind: v.optional(sessionPersistenceKindValidator),
    startDesktop: v.optional(v.boolean()),
    streamingEntityId: v.optional(v.string()),
  },
  returns: v.object({ sandboxId: v.string() }),
  handler: async (ctx, args) => {
    const completedSteps: Array<{
      type: string;
      label: string;
      status: string;
    }> = [];
    const emitProgress = async (label: string): Promise<void> => {
      if (!args.streamingEntityId) return;
      const steps = [
        ...completedSteps,
        { type: "tool", label, status: "active" },
      ];
      await ctx.runMutation(internal.streaming.internalSet, {
        entityId: args.streamingEntityId,
        currentActivity: JSON.stringify(steps),
      });
      completedSteps.push({ type: "tool", label, status: "complete" });
    };

    const setupStartedAt = Date.now();
    console.log(
      `[daytona] prepareSandbox: resolving context for repo=${args.repoOwner}/${args.repoName} repoId=${args.repoId} ephemeral=${args.ephemeral ?? false}`,
    );
    const { daytona, sandboxEnvVars, snapshotName } =
      await resolveSandboxContext(ctx, args.repoId);
    const sessionVolumeMounts =
      args.sessionPersistenceId && args.sessionPersistenceKind
        ? await ensureSessionPersistenceVolumes(
            daytona,
            args.repoId,
            args.sessionPersistenceKind,
            args.sessionPersistenceId,
          )
        : undefined;
    console.log(
      `[daytona] prepareSandbox: context resolved in ${Date.now() - setupStartedAt}ms — snapshot=${snapshotName ?? "none"}, volumes=${sessionVolumeMounts?.length ?? 0}, existingSandbox=${args.existingSandboxId ?? "none"}`,
    );
    let sandbox: Sandbox | undefined;
    let deleteSandboxOnFailure = false;
    let attempt = 1;
    const maxSetupAttempts = 3;
    const attachRunSandbox = async (
      sandboxToAttach: Sandbox,
    ): Promise<void> => {
      if (!args.attachRunId) {
        return;
      }
      await ctx.runMutation(internal.taskWorkflow.saveSandboxId, {
        runId: args.attachRunId,
        sandboxId: sandboxToAttach.id,
      });
    };

    while (true) {
      try {
        if (args.ephemeral) {
          const prepared = await createSandboxAndPrepareRepo(
            ctx,
            daytona,
            args.installationId,
            args.repoOwner,
            args.repoName,
            sandboxEnvVars,
            EPHEMERAL_LIFECYCLE,
            snapshotName,
            sessionVolumeMounts,
            attachRunSandbox,
            emitProgress,
            { mode: "none" },
          );
          sandbox = prepared.sandbox;
          deleteSandboxOnFailure = true;
        } else {
          const prepared = await getOrCreateSandbox(
            ctx,
            daytona,
            args.existingSandboxId,
            args.installationId,
            args.repoOwner,
            args.repoName,
            sandboxEnvVars,
            SESSION_LIFECYCLE,
            snapshotName,
            sessionVolumeMounts,
            emitProgress,
            { mode: "none" },
          );
          sandbox = prepared.sandbox;
          deleteSandboxOnFailure = prepared.isNew;
        }

        if (args.branchName) {
          await emitProgress("Setting up branch...");
          await setupBranch(
            sandbox,
            args.branchName,
            args.baseBranch ?? FALLBACK_GIT_BASE_BRANCH,
          );
        } else if (args.baseBranch) {
          await emitProgress("Checking out base branch...");
          await checkoutFetchedBaseBranch(sandbox, args.baseBranch);
        }

        if (args.startDesktop) {
          await emitProgress("Starting desktop...");
          await startDesktopWithChrome(sandbox);
        }

        break;
      } catch (error) {
        if (deleteSandboxOnFailure && sandbox) {
          console.warn(
            `[daytona] prepareSandbox: deleting failed sandbox ${sandbox.id}`,
          );
          try {
            await sandbox.delete();
          } catch {}
          // Best-effort cleanup of the credential-helper row. No-op if absent.
          await ctx.runMutation(
            internal.sandboxGitCredentials.deleteBySandboxId,
            { sandboxId: sandbox.id },
          );
        }

        const message = errorMessage(error, "Sandbox setup failed");
        const elapsed = Date.now() - setupStartedAt;
        const retryable = isSandboxSetupRetryable(message);
        const withinTimeLimit = elapsed < MAX_SETUP_ELAPSED_MS;
        const shouldRetry = retryable && withinTimeLimit;

        console.warn(
          `[daytona] prepareSandbox: attempt ${attempt}/${maxSetupAttempts} failed after ${elapsed}ms — retryable=${retryable}, withinTimeLimit=${withinTimeLimit}, shouldRetry=${shouldRetry}: ${message}`,
        );

        if (!shouldRetry || attempt >= maxSetupAttempts) {
          console.error(
            `[daytona] prepareSandbox: giving up after ${attempt} attempt(s), total elapsed=${elapsed}ms: ${message}`,
          );
          throw error;
        }

        const delayMs =
          2500 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 1000);
        console.warn(`[daytona] prepareSandbox: retrying in ${delayMs}ms`);
        await sleep(delayMs);
        completedSteps.length = 0;
        await emitProgress("Retrying sandbox setup...");
        attempt += 1;
        sandbox = undefined;
        deleteSandboxOnFailure = false;
      }
    }

    if (!sandbox) {
      throw new Error("Sandbox setup failed");
    }

    const totalElapsed = Date.now() - setupStartedAt;
    console.log(
      `[daytona] prepareSandbox: success in ${totalElapsed}ms, sandboxId=${sandbox.id}, attempts=${attempt}`,
    );
    return { sandboxId: sandbox.id };
  },
});

/** Creates or resumes a sandbox without performing repo sync. */
export const createOrResumeSandbox = internalAction({
  args: {
    existingSandboxId: v.optional(v.string()),
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.optional(v.string()),
    baseBranch: v.optional(v.string()),
    ephemeral: v.optional(v.boolean()),
    repoId: v.id("githubRepos"),
    sessionPersistenceId: v.optional(sessionPersistenceIdValidator),
    sessionPersistenceKind: v.optional(sessionPersistenceKindValidator),
    attachRunId: v.optional(v.id("agentRuns")),
    streamingEntityId: v.optional(v.string()),
  },
  returns: v.object({ sandboxId: v.string() }),
  handler: async (ctx, args) => {
    const completedSteps: Array<{
      type: string;
      label: string;
      status: string;
    }> = [];
    const emitProgress = async (label: string): Promise<void> => {
      if (!args.streamingEntityId) return;
      const steps = [
        ...completedSteps,
        { type: "tool", label, status: "active" },
      ];
      await ctx.runMutation(internal.streaming.internalSet, {
        entityId: args.streamingEntityId,
        currentActivity: JSON.stringify(steps),
      });
      completedSteps.push({ type: "tool", label, status: "complete" });
    };

    const setupStartedAt = Date.now();
    console.log(
      `[daytona] createOrResumeSandbox: resolving context for repo=${args.repoOwner}/${args.repoName} repoId=${args.repoId} ephemeral=${args.ephemeral ?? false}`,
    );
    const { daytona, sandboxEnvVars, snapshotName } =
      await resolveSandboxContext(ctx, args.repoId);
    const sessionVolumeMounts =
      args.sessionPersistenceId && args.sessionPersistenceKind
        ? await ensureSessionPersistenceVolumes(
            daytona,
            args.repoId,
            args.sessionPersistenceKind,
            args.sessionPersistenceId,
          )
        : undefined;
    console.log(
      `[daytona] createOrResumeSandbox: context resolved in ${Date.now() - setupStartedAt}ms — snapshot=${snapshotName ?? "none"}, volumes=${sessionVolumeMounts?.length ?? 0}, existingSandbox=${args.existingSandboxId ?? "none"}`,
    );

    let sandbox: Sandbox | undefined;
    let deleteSandboxOnFailure = false;
    let attempt = 1;
    const maxSetupAttempts = 3;
    const attachRunSandbox = async (
      sandboxToAttach: Sandbox,
    ): Promise<void> => {
      if (!args.attachRunId) {
        return;
      }
      await ctx.runMutation(internal.taskWorkflow.saveSandboxId, {
        runId: args.attachRunId,
        sandboxId: sandboxToAttach.id,
      });
    };

    while (true) {
      try {
        if (args.ephemeral) {
          const prepared = await createSandboxAndPrepareRepo(
            ctx,
            daytona,
            args.installationId,
            args.repoOwner,
            args.repoName,
            sandboxEnvVars,
            EPHEMERAL_LIFECYCLE,
            snapshotName,
            sessionVolumeMounts,
            attachRunSandbox,
            emitProgress,
            { mode: "none" },
          );
          sandbox = prepared.sandbox;
          deleteSandboxOnFailure = true;
        } else {
          const prepared = await getOrCreateSandbox(
            ctx,
            daytona,
            args.existingSandboxId,
            args.installationId,
            args.repoOwner,
            args.repoName,
            sandboxEnvVars,
            SESSION_LIFECYCLE,
            snapshotName,
            sessionVolumeMounts,
            emitProgress,
            { mode: "none" },
          );
          sandbox = prepared.sandbox;
          deleteSandboxOnFailure = prepared.isNew;
        }

        if (!args.ephemeral && args.attachRunId && sandbox) {
          await ctx.runMutation(internal.taskWorkflow.saveSandboxId, {
            runId: args.attachRunId,
            sandboxId: sandbox.id,
          });
        }

        break;
      } catch (error) {
        if (deleteSandboxOnFailure && sandbox) {
          console.warn(
            `[daytona] createOrResumeSandbox: deleting failed sandbox ${sandbox.id}`,
          );
          try {
            await sandbox.delete();
          } catch {}
          // Best-effort cleanup of the credential-helper row. No-op if absent.
          await ctx.runMutation(
            internal.sandboxGitCredentials.deleteBySandboxId,
            { sandboxId: sandbox.id },
          );
        }

        const message = errorMessage(error, "Sandbox setup failed");
        const elapsed = Date.now() - setupStartedAt;
        const retryable = isSandboxSetupRetryable(message);
        const withinTimeLimit = elapsed < MAX_SETUP_ELAPSED_MS;
        const shouldRetry = retryable && withinTimeLimit;

        console.warn(
          `[daytona] createOrResumeSandbox: attempt ${attempt}/${maxSetupAttempts} failed after ${elapsed}ms — retryable=${retryable}, withinTimeLimit=${withinTimeLimit}, shouldRetry=${shouldRetry}: ${message}`,
        );

        if (!shouldRetry || attempt >= maxSetupAttempts) {
          console.error(
            `[daytona] createOrResumeSandbox: giving up after ${attempt} attempt(s), total elapsed=${elapsed}ms: ${message}`,
          );
          throw error;
        }

        const delayMs =
          2500 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 1000);
        console.warn(
          `[daytona] createOrResumeSandbox: retrying in ${delayMs}ms`,
        );
        await sleep(delayMs);
        completedSteps.length = 0;
        await emitProgress("Retrying sandbox setup...");
        attempt += 1;
        sandbox = undefined;
        deleteSandboxOnFailure = false;
      }
    }

    if (!sandbox) {
      throw new Error("Sandbox setup failed");
    }

    const totalElapsed = Date.now() - setupStartedAt;
    console.log(
      `[daytona] createOrResumeSandbox: success in ${totalElapsed}ms, sandboxId=${sandbox.id}, attempts=${attempt}`,
    );
    return { sandboxId: sandbox.id };
  },
});

/** Fetches a base branch from the remote origin into the sandbox. */
export const fetchBaseBranch = internalAction({
  args: {
    sandboxId: v.string(),
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    baseBranch: v.string(),
    repoId: v.id("githubRepos"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);
    await fetchOrigin(sandbox, args.repoOwner, args.repoName, args.baseBranch, {
      prune: false,
      timeoutSeconds: 120,
      retryAttempts: 2,
    });
    return null;
  },
});

/** Checks out a previously fetched base branch in the sandbox. */
export const checkoutBaseBranch = internalAction({
  args: {
    sandboxId: v.string(),
    baseBranch: v.string(),
    repoId: v.id("githubRepos"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);
    await checkoutFetchedBaseBranch(sandbox, args.baseBranch);
    return null;
  },
});

/** Configures the GitHub origin and sets up a working branch in the sandbox. */
export const setupSandboxBranch = internalAction({
  args: {
    sandboxId: v.string(),
    branchName: v.string(),
    baseBranch: v.string(),
    repoId: v.id("githubRepos"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);
    await setupBranch(sandbox, args.branchName, args.baseBranch);
    return null;
  },
});

/** Publishes the sandbox's current local branch using a fresh GitHub App token. */
export const pushSandboxBranch = internalAction({
  args: {
    sandboxId: v.string(),
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.string(),
    repoId: v.id("githubRepos"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);
    await pushBranchToOrigin(
      sandbox,
      args.repoOwner,
      args.repoName,
      args.branchName,
      { timeoutSeconds: 90, retryAttempts: 3 },
    );
    return null;
  },
});

/** Launches an AI agent script on an existing sandbox with streaming and token setup. */
// Shell one-liner (run on the sandbox) that hands a new prompt to a live warm
// daemon for THIS entity: if the pid is alive and the entity matches, it writes
// the base64 prompt to the prompt file and touches the ready marker the daemon
// polls for, echoing "handed"; otherwise "respawn". Shared by the workflow
// fast-path probe and launchOnExistingSandbox's inline handoff.
function buildDaemonHandoffCommand(
  entityId: string,
  promptB64: string,
): string {
  return `if [ -f /tmp/eva-daemon.pid ] && kill -0 "$(cat /tmp/eva-daemon.pid)" 2>/dev/null && [ "$(cat /tmp/eva-daemon.entity 2>/dev/null)" = ${JSON.stringify(entityId)} ]; then echo ${promptB64} | base64 -d > /tmp/eva-daemon-prompt.txt && touch /tmp/eva-daemon-prompt.ready && echo handed; else echo respawn; fi`;
}

/**
 * Fast-path warm-daemon handoff probe (Claude sdk-daemon sessions only).
 *
 * A warm turn does not need the sandbox thaw + validate gauntlet the full launch
 * path runs: if a daemon is already alive in the (running) sandbox for this
 * session, we can hand it the prompt directly in one quick exec, skipping two
 * durable Daytona steps (~3–7s). This action is deliberately failure-tolerant —
 * on ANY error (sandbox stopped/archived/unreachable, no daemon, entity
 * mismatch) it returns `{ handed: false }` so the caller falls through to the
 * full cold path (which thaws, validates and respawns). It never starts a
 * sandbox or respawns a runner itself.
 */
export const tryWarmDaemonHandoff = internalAction({
  args: {
    sandboxId: v.string(),
    entityId: v.string(),
    prompt: v.string(),
    repoId: v.id("githubRepos"),
  },
  returns: v.object({ handed: v.boolean() }),
  handler: async (ctx, args) => {
    const startedAt = Date.now();
    try {
      const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);
      const promptB64 = Buffer.from(args.prompt, "utf8").toString("base64");
      const out = await exec(
        sandbox,
        buildDaemonHandoffCommand(args.entityId, promptB64),
        10,
      );
      const handed = out.trim().endsWith("handed");
      console.log(
        `[daytona][execution] tryWarmDaemonHandoff handed=${handed} in ${Date.now() - startedAt}ms entityId=${args.entityId}`,
      );
      return { handed };
    } catch (error) {
      console.log(
        `[daytona][execution] tryWarmDaemonHandoff miss in ${Date.now() - startedAt}ms entityId=${args.entityId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return { handed: false };
    }
  },
});

/**
 * Pre-warm a session's Claude daemon so the user's FIRST message is warm.
 *
 * The ~20s "slow hi" is a cold respawn: after the daemon idle-exits (or a
 * fresh/resumed sandbox), the first message pays token mint + 132KB script
 * upload + node/CLI boot before any token. This action, fired when the session
 * page opens, does that boot ahead of time: it launches the daemon in
 * CLAUDE_PREWARM mode (create the warm query() — spawning + warming the claude
 * CLI/MCP/API — then wait for the first prompt via the handoff protocol). By
 * the time the user types, tryWarmDaemonHandoff finds a live daemon and the turn
 * skips the boot entirely. No-op if a daemon is already alive for this session.
 * Best-effort: any failure is swallowed (the normal path still works).
 */
export const prewarmSessionDaemon = internalAction({
  args: {
    sandboxId: v.string(),
    sessionId: v.id("sessions"),
    repoId: v.id("githubRepos"),
    userId: v.id("users"),
    model: v.optional(v.string()),
    allowedTools: v.optional(v.string()),
    sessionPersistenceId: v.optional(sessionPersistenceIdValidator),
  },
  returns: v.object({ prewarmed: v.boolean() }),
  handler: async (ctx, args) => {
    const startedAt = Date.now();
    try {
      const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);
      const sessionIdStr = String(args.sessionId);
      const fp = CALLBACK_SCRIPT_FINGERPRINT;
      // Live daemon for this session with a matching callback fingerprint?
      const alive = await exec(
        sandbox,
        `if [ -f /tmp/eva-daemon.pid ] && kill -0 "$(cat /tmp/eva-daemon.pid)" 2>/dev/null && [ "$(cat /tmp/eva-daemon.entity 2>/dev/null)" = ${JSON.stringify(sessionIdStr)} ] && [ "$(cat /tmp/eva-callback-fp 2>/dev/null)" = ${JSON.stringify(fp)} ]; then echo alive; elif [ -f /tmp/eva-daemon.pid ] && kill -0 "$(cat /tmp/eva-daemon.pid)" 2>/dev/null && [ "$(cat /tmp/eva-daemon.entity 2>/dev/null)" = ${JSON.stringify(sessionIdStr)} ]; then echo stale; else echo cold; fi`,
        10,
      );
      const aliveState = alive.trim().split("\n").pop()?.trim() ?? "cold";
      if (aliveState === "alive") {
        console.log(
          `[daytona][execution] prewarmSessionDaemon: already warm sessionId=${args.sessionId}`,
        );
        return { prewarmed: false };
      }
      if (aliveState === "stale") {
        console.log(
          `[daytona][execution] prewarmSessionDaemon: stale callback script — uploading bundle without killing live daemon sessionId=${args.sessionId}`,
        );
        await uploadCallbackScriptBundle(sandbox);
        return { prewarmed: false };
      }

      await ensureSandboxRunning(sandbox, {
        timeoutSeconds: ARCHIVED_SANDBOX_READY_TIMEOUT_SECONDS,
      });

      const normalizedModel = normalizeAIModel(args.model);
      const claudeSessionId =
        getAIModelProvider(normalizedModel) === "claude" &&
        args.sessionPersistenceId
          ? sessionClaudeUuid(args.sessionPersistenceId)
          : undefined;

      // Empty prompt: the daemon in CLAUDE_PREWARM mode never reads it — it
      // waits for the first real message via the handoff ready-file.
      await signAndLaunchScript(
        ctx,
        sandbox,
        args.userId,
        "",
        "sessionWorkflow:handleCompletion",
        "sessionId",
        String(args.sessionId),
        args.repoId,
        {
          model: normalizedModel,
          allowedTools: args.allowedTools,
          extraEnvVars: { CLAUDE_PREWARM: "1" },
          claudeSessionId,
          enableMcp: true,
        },
      );
      console.log(
        `[daytona][execution] prewarmSessionDaemon: launched in ${Date.now() - startedAt}ms sessionId=${args.sessionId}`,
      );
      return { prewarmed: true };
    } catch (error) {
      console.log(
        `[daytona][execution] prewarmSessionDaemon: skipped in ${Date.now() - startedAt}ms sessionId=${args.sessionId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return { prewarmed: false };
    }
  },
});

export const launchOnExistingSandbox = internalAction({
  args: {
    sandboxId: v.string(),
    entityId: v.string(),
    prompt: v.string(),
    userId: v.id("users"),
    completionMutation: v.string(),
    entityIdField: v.string(),
    model: v.optional(v.string()),
    allowedTools: v.optional(v.string()),
    systemPrompt: v.optional(v.string()),
    repoId: v.id("githubRepos"),
    streamingEntityId: v.optional(v.string()),
    runId: v.optional(v.string()),
    sessionPersistenceId: v.optional(sessionPersistenceIdValidator),
    taskProofCaptureEnabled: v.optional(v.boolean()),
    requireTaskCommit: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const launchStartedAt = Date.now();
    console.log(
      `[daytona][execution] launchOnExistingSandbox started entityId=${args.entityId} sandboxId=${args.sandboxId} repoId=${args.repoId}`,
    );
    const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);

    // Warm-daemon handoff (Claude sessions only): if a persistent daemon is
    // alive in this sandbox for THIS session, hand it the new prompt via a file
    // + ready marker instead of killing and respawning the runner. The daemon
    // keeps its `query()` (and the warm CLI/MCP/API connection) alive, so the
    // turn skips the ~several-second boot. Falls through to a fresh spawn if no
    // healthy matching daemon exists (first turn, crash, entity mismatch).
    if (
      process.env.CLAUDE_ATTEMPT_MODE === "sdk-daemon" &&
      args.completionMutation === "sessionWorkflow:handleCompletion"
    ) {
      const promptB64 = Buffer.from(args.prompt, "utf8").toString("base64");
      const handoff = await exec(
        sandbox,
        buildDaemonHandoffCommand(args.entityId, promptB64),
        15,
      );
      if (handoff.trim().endsWith("handed")) {
        console.log(
          `[daytona][execution] handed prompt to warm daemon in ${Date.now() - launchStartedAt}ms entityId=${args.entityId}`,
        );
        return null;
      }
    }

    await exec(
      sandbox,
      "pkill -f 'claude-code' 2>/dev/null; pkill -f 'codex' 2>/dev/null; pkill -f 'opencode' 2>/dev/null; pkill -f 'cursor-agent' 2>/dev/null; pkill -f 'run-design.mjs' 2>/dev/null; true",
      10,
    );
    console.log(
      `[daytona][execution] cleaned prior runner in ${Date.now() - launchStartedAt}ms entityId=${args.entityId}`,
    );

    const extraEnvVars: Record<string, string> = {};
    if (args.streamingEntityId) {
      extraEnvVars.STREAMING_ENTITY_ID = args.streamingEntityId;
      const existing = await ctx.runQuery(internal.streaming.internalGet, {
        entityId: args.streamingEntityId,
      });
      if (existing) {
        extraEnvVars.PRIOR_STEPS = existing.currentActivity;
      }
    }
    if (args.runId) {
      extraEnvVars.RUN_ID = args.runId;
    }
    if (args.taskProofCaptureEnabled !== undefined) {
      extraEnvVars.TASK_PROOF_CAPTURE_ENABLED = args.taskProofCaptureEnabled
        ? "true"
        : "false";
    }
    if (args.requireTaskCommit === true) {
      extraEnvVars.REQUIRE_TASK_COMMIT = "true";
    }
    extraEnvVars.CLAUDE_MAX_TOTAL_RUNTIME_MS = QUICK_TASK_MAX_TOTAL_RUNTIME_MS;

    const normalizedModel = normalizeAIModel(args.model);
    const claudeSessionId =
      getAIModelProvider(normalizedModel) === "claude" &&
      args.sessionPersistenceId
        ? sessionClaudeUuid(args.sessionPersistenceId)
        : undefined;

    await signAndLaunchScript(
      ctx,
      sandbox,
      args.userId,
      args.prompt,
      args.completionMutation,
      args.entityIdField,
      args.entityId,
      args.repoId,
      {
        model: normalizedModel,
        allowedTools: args.allowedTools,
        systemPrompt: args.systemPrompt,
        extraEnvVars:
          Object.keys(extraEnvVars).length > 0 ? extraEnvVars : undefined,
        claudeSessionId,
        enableMcp: true,
      },
    );
    console.log(
      `[daytona][execution] launchOnExistingSandbox finished in ${Date.now() - launchStartedAt}ms entityId=${args.entityId} sandboxId=${args.sandboxId}`,
    );

    return null;
  },
});
