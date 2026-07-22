"use node";

import { v } from "convex/values";
import type { SandboxHandle } from "../_sandbox/provider";
import { action, internalAction } from "../_generated/server";
import { api, internal } from "../_generated/api";
import { FALLBACK_GIT_BASE_BRANCH } from "@conductor/shared";
import {
  getAIModelProvider,
  normalizeAIModel,
  reasoningLevelValidator,
} from "../validators";
import {
  execHandle,
  resolveSandboxContext,
  getSandboxHandle,
  getDaytona,
  ensureSandboxRunning,
  ARCHIVED_SANDBOX_READY_TIMEOUT_SECONDS,
  sleep,
  errorMessage,
  signAndLaunchScript,
  workspaceDirShell,
  KILL_PRIOR_AGENT_PROCESSES_CMD,
} from "./helpers";
import { CALLBACK_SCRIPT_FINGERPRINT } from "./callbackScriptFingerprint";
import { uploadCallbackScriptBundle } from "./launch";
import {
  materializeAttachmentsToSandbox,
  buildAttachmentPromptNote,
} from "./attachments";
import {
  resolveSandboxCredentials,
  resolveDaytonaApiKey,
} from "../envVarResolver";
import { resolveExistingSandboxId } from "../_sandbox/resolveExistingSandboxId";
import {
  buildConvexBackgroundScriptBody,
  isConvexBackendCommand,
} from "./convexLocalBackend";
import {
  detectPackageManager,
  launchDevServerInBackground,
  isDevServerBooting,
  restoreSeededRuntimeState as restoreSeededRuntimeStateInSandbox,
} from "./devServer";
import { isDaytonaNetworkIssue } from "../_taskWorkflow/recovery";

async function resolveDevCommandForPreview(
  handle: SandboxHandle,
  repo: { rootDirectory?: string; devPort?: number; devCommand?: string },
  port: number,
): Promise<string> {
  const rootDir = repo.rootDirectory ?? "";
  const dir = rootDir
    ? `${workspaceDirShell()}/${rootDir}`
    : workspaceDirShell();
  const effectivePort = repo.devPort ?? port;
  if (repo.devCommand && repo.devCommand.trim().length > 0) {
    return `cd ${workspaceDirShell()} && HOSTNAME=0.0.0.0 PORT=${effectivePort} ${repo.devCommand}`;
  }
  const pm = await detectPackageManager(handle, rootDir);
  return `cd ${dir} && HOSTNAME=0.0.0.0 PORT=${effectivePort} ${pm} run dev`;
}

/** True if anything is LISTEN on `port` (Vercel images often lack `ss`). */
function portListenProbeCmd(port: number): string {
  const hex = port.toString(16).toUpperCase().padStart(4, "0");
  return [
    `if command -v ss >/dev/null 2>&1; then ss -ltn 2>/dev/null | grep -q ":${port} " && echo yes && exit 0; fi`,
    `if command -v lsof >/dev/null 2>&1; then lsof -iTCP:${port} -sTCP:LISTEN >/dev/null 2>&1 && echo yes && exit 0; fi`,
    // /proc/net/tcp{,6} local_address port is hex, big-endian (13000 → 32C8).
    `if grep -Eiq ":${hex}[[:space:]]" /proc/net/tcp /proc/net/tcp6 2>/dev/null; then echo yes; exit 0; fi`,
    "echo no",
  ].join("; ");
}

async function probePreviewReady(
  handle: SandboxHandle,
  port: number,
): Promise<boolean> {
  try {
    // Prefer a listen check: Next/Vite often bind before the first route
    // finishes compiling. A short HTTP curl times out mid-compile and used to
    // trigger remount → kill → relaunch loops (session 41 / CarePulse web).
    const listening = (
      await execHandle(handle, portListenProbeCmd(port), 5)
    ).trim();
    if (listening === "yes") return true;

    const result = await execHandle(
      handle,
      `curl -s -o /dev/null -w "%{http_code}" --max-time 2 http://127.0.0.1:${port}`,
      5,
    );
    const code = parseInt(result.trim() || "0", 10);
    return code >= 200 && code < 500;
  } catch {
    return false;
  }
}
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
import {
  ensurePreviewNavigationProxy,
  VERCEL_PREVIEW_PROXY_PORT,
  VERCEL_DESKTOP_INTERNAL_PORT,
  VERCEL_EDITOR_INTERNAL_PORT,
} from "./previewProxy";
import { vercelAppListenPort } from "./vercelAppPorts";
import { getPreviewGrantPublicJwk, signPreviewGrant } from "../previewGrant";
import { PREVIEW_GRANT_PARAM } from "../previewGrantConfig";

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
      const sandbox = await getSandboxHandle(ctx, args.repoId, args.sandboxId);
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
    const handle = await getSandboxHandle(ctx, args.repoId, args.sandboxId);
    return (
      await execHandle(handle, args.command, args.timeoutSeconds ?? 30)
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
    const handle = await getSandboxHandle(ctx, args.repoId, args.sandboxId);
    try {
      await execHandle(handle, "test -f /tmp/.startup-commands-done", 5);
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
    const sandbox = await getSandboxHandle(ctx, args.repoId, args.sandboxId);
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

    const sandbox = await getSandboxHandle(ctx, args.repoId, args.sandboxId);

    if (!args.force) {
      // Check if startup commands have already run (marker file)
      try {
        await execHandle(sandbox, "test -f /tmp/.startup-commands-done", 5);
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
        const output = await execHandle(sandbox, command, 600);
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
        await execHandle(sandbox, "touch /tmp/.startup-commands-done", 5);
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
    /**
     * When true, skip daemons whose `/tmp/bg-<i>.pid` is still alive.
     * Used before proof capture so we do not double-start Convex.
     */
    onlyRestartDead: v.optional(v.boolean()),
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

    const sandbox = await getSandboxHandle(ctx, args.repoId, args.sandboxId);

    console.log(
      `[daytona] runBackgroundCommands: launching ${commands.length} background command(s)${args.onlyRestartDead ? " (onlyRestartDead)" : ""}`,
    );

    const errors: string[] = [];
    let launched = 0;
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      const isConvexCommand = isConvexBackendCommand(command);
      if (args.onlyRestartDead) {
        // `kill -0` is true for zombies (state Z). After `npx convex dev`
        // dies, a defunct bash PID left heal permanently skipping relaunch.
        const alive = (
          await execHandle(
            sandbox,
            [
              `pid=$(cat /tmp/bg-${i}.pid 2>/dev/null || true)`,
              `if [ -z "$pid" ] || ! kill -0 "$pid" 2>/dev/null; then echo dead; exit 0; fi`,
              `state=$(awk '{print $3}' /proc/"$pid"/stat 2>/dev/null || echo Z)`,
              `if [ "$state" = "Z" ]; then echo dead; else echo alive; fi`,
            ].join("; "),
            5,
          )
        ).trim();
        if (alive === "alive") {
          console.log(
            `[daytona] runBackgroundCommands: still alive, skip: ${command}`,
          );
          continue;
        }
      }
      // Drop a stale pid / leftover Convex before (re)launch so a zombie or
      // half-dead backend cannot keep :3210 / ExportInProgress wedged.
      const cleanup = [
        `pid=$(cat /tmp/bg-${i}.pid 2>/dev/null || true)`,
        `if [ -n "$pid" ]; then kill -TERM "$pid" 2>/dev/null || true; kill -KILL "$pid" 2>/dev/null || true; fi`,
        `rm -f /tmp/bg-${i}.pid`,
      ];
      if (isConvexCommand) {
        // Use `[c]onvex` so pkill does not match this cleanup shell's cmdline.
        cleanup.push(
          `pkill -TERM -f '[c]onvex-local-backend' 2>/dev/null || true`,
          `pkill -TERM -f '[c]onvex dev' 2>/dev/null || true`,
          `sleep 1`,
          `pkill -KILL -f '[c]onvex-local-backend' 2>/dev/null || true`,
          `pkill -KILL -f '[c]onvex dev' 2>/dev/null || true`,
        );
      }
      cleanup.push("true");
      await execHandle(sandbox, cleanup.join("; "), 15);
      const logPath = `/tmp/bg-${i}.log`;
      // Escape single quotes for the bash -lc payload.
      // Write the command to a script file and launch THAT, rather than
      // inlining it via `bash -lc '<command>'`: the inline form puts the whole
      // command text into the wrapper shell's cmdline, so a user guard like
      // `pgrep -f "[c]onvex dev" || npx convex dev` matches its own wrapper
      // (the unguarded "npx convex dev" launch text) and silently never starts
      // the daemon. With a script file the cmdline is just the file path.
      // Base64 transport also makes user quoting unbreakable.
      //
      // CarePulse local backends: plant glibc-safe binary + unset agent mode.
      // See convexLocalBackend.ts (anonymous mode rejects --local-backend-version).
      const scriptBody = isConvexCommand
        ? buildConvexBackgroundScriptBody(command)
        : command;
      const cb64 = Buffer.from(scriptBody, "utf8").toString("base64");
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
        await execHandle(sandbox, launchCmd, 10);
        launched += 1;
      } catch (e) {
        const msg = errorMessage(e, "command failed");
        console.error(
          `[daytona] runBackgroundCommands: failed to launch: ${command}`,
          msg,
        );
        errors.push(`${command}: ${msg}`);
      }
    }

    return {
      ran: launched > 0 || !args.onlyRestartDead,
      commandCount: launched,
      errors,
    };
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

    const handle = await getSandboxHandle(ctx, args.repoId, args.sandboxId);

    console.log(
      `[daytona] runStopCommands: running ${commands.length} stop command(s)`,
    );

    const errors: string[] = [];
    for (const command of commands) {
      console.log(`[daytona] runStopCommands: running: ${command}`);
      try {
        await execHandle(handle, command, 300);
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

    const { credentials } = await resolveSandboxCredentials(ctx, args.repoId);
    const handle = await getSandboxHandle(ctx, args.repoId, args.sandboxId);

    // On Vercel, services listen on internal ports and the auth proxy owns the
    // exposed port (desktop 16080→6080, editor 18080→8080, app listen→3000).
    // Probe the upstream service port for readiness, not the proxy port.
    const upstreamPort =
      credentials.kind === "vercel" && args.port === 6080
        ? VERCEL_DESKTOP_INTERNAL_PORT
        : credentials.kind === "vercel" && args.port === 8080
          ? VERCEL_EDITOR_INTERNAL_PORT
          : credentials.kind === "vercel"
            ? vercelAppListenPort(args.port)
            : args.port;

    let ready = true;
    if (args.checkReady) {
      // Never probe or restart the dev server on a sandbox that is not
      // running. On Vercel every exec goes through the SDK's withResume: on a
      // stopped sandbox it RESUMES it, and on a stopping/snapshotting one it
      // waits the stop out and then revives it — so the preview poll loop was
      // waking sandboxes the user had just stopped. Report not-ready without
      // touching the VM; polling recovers once the sandbox is started again.
      // (handle.state is fresh: getSandboxHandle fetches with resume:false.)
      if (handle.state !== "running") {
        return { url: "", port: args.port, ready: false };
      }
      // Background daemons (e.g. `npx convex dev`) only relaunch on sandbox
      // start/resume. If they die while status stays active, Preview would
      // keep loading a frontend with a dead backend. Cheap pid check; skip
      // when still alive.
      try {
        await ctx.runAction(internal.daytona.runBackgroundCommands, {
          sandboxId: args.sandboxId,
          repoId: args.repoId,
          onlyRestartDead: true,
        });
      } catch (e) {
        console.warn(
          `[daytona] preview background heal failed sandbox=${args.sandboxId}: ${errorMessage(e, "heal failed")}`,
        );
      }
      ready = await probePreviewReady(handle, upstreamPort);
      // Only auto-restart the app/dev server for app preview ports.
      // Desktop (6080) and editor (8080) are started by their own toggle
      // actions — launching `pnpm run dev` onto those ports would clobber
      // noVNC/websockify or code-server and surface as SANDBOX_NOT_LISTENING.
      //
      // Vercel: Preview must NOT background-launch the app. Lifecycle owns
      // Console (`launchPreviewDevServer` → tmux). Remount via
      // `launchDevServerInBackground` raced resume and hit EADDRINUSE.
      // Probe-only here; Console is the single launcher.
      const isDesktopOrEditorPort = args.port === 6080 || args.port === 8080;
      if (!ready && !isDesktopOrEditorPort && credentials.kind !== "vercel") {
        try {
          if (await isDevServerBooting(handle, args.port)) {
            console.log(
              `[daytona] preview restart skipped (booting) sandbox=${args.sandboxId} port=${args.port}`,
            );
          } else {
            const devCommand = await resolveDevCommandForPreview(
              handle,
              repo,
              args.port,
            );
            await launchDevServerInBackground(handle, devCommand, args.port);
            await sleep(8);
            ready = await probePreviewReady(handle, args.port);
          }
        } catch (e) {
          console.warn(
            `[daytona] preview dev server restart failed sandbox=${args.sandboxId} port=${args.port}: ${errorMessage(e, "restart failed")}`,
          );
        }
      }
    }

    // Always front the service with the in-sandbox auth proxy so open-in-new-tab
    // is gated the same way for Preview, Computer, and Editor.
    //
    // Vercel exposes a fixed 4-port set. Map:
    //   app/dev → proxy on 3000 (upstream = listen port; 54321 left for Supabase)
    //   editor  → proxy on 8080  (upstream 18080)
    //   desktop → proxy on 6080  (upstream 16080)
    // Daytona uses a free 9xxx proxy port in front of the real service port.
    const previewPublicJwk = getPreviewGrantPublicJwk();
    const isVercelDesktopOrEditor =
      credentials.kind === "vercel" &&
      (args.port === 6080 || args.port === 8080);
    const fixedVercelProxyPort =
      credentials.kind !== "vercel"
        ? undefined
        : isVercelDesktopOrEditor
          ? args.port
          : VERCEL_PREVIEW_PROXY_PORT;
    // Public route port: on Vercel app/dev previews this is always 3000, never
    // the upstream listen port (e.g. Next 13000 / 3001, Vite 5173).
    let previewPort = fixedVercelProxyPort ?? args.port;
    // Same upstream mapping used for the readiness probe above.
    const proxyTargetPort = upstreamPort;
    const shouldStartPreviewProxy =
      credentials.kind === "daytona" || fixedVercelProxyPort !== undefined;
    if (ready && shouldStartPreviewProxy) {
      try {
        previewPort = await ensurePreviewNavigationProxy(
          handle,
          proxyTargetPort,
          {
            publicKeyJwk: previewPublicJwk,
            sandboxId: args.sandboxId,
            repoId: args.repoId,
            webAppUrl: process.env.WEB_APP_URL ?? "",
            inject: args.navigationSync === true,
            // Browser-facing port for /preview-auth (public proxy, not listen).
            authPort: fixedVercelProxyPort ?? args.port,
          },
          fixedVercelProxyPort,
        );
      } catch (e) {
        const proxyErrorMessage = errorMessage(e, "proxy startup failed");
        console.warn(
          `[daytona] preview navigation proxy unavailable for sandbox=${args.sandboxId} port=${args.port}: ${proxyErrorMessage}`,
        );
        // Vercel only exposes a fixed, small port set (VERCEL_DEFAULT_EXPOSED_PORTS).
        // If the reserved proxy port fails to start while a preview grant
        // key is configured, silently falling back to the unproxied service
        // port would serve with no auth gate at all. Fail loudly instead.
        if (fixedVercelProxyPort !== undefined && previewPublicJwk) {
          throw new Error(
            `Vercel preview proxy failed to start on port ${fixedVercelProxyPort}: ${proxyErrorMessage}`,
          );
        }
      }
    }

    const signedPreview = await handle.previewUrl(previewPort, 86400);
    const parsedUrl = new URL(signedPreview.url);
    parsedUrl.protocol = "https:";

    // Append a fresh short-lived grant so the in-app iframe (and the authed
    // user's "open in new tab") loads without a login round-trip. The proxy
    // exchanges it for a session cookie on first load. Only when gating is
    // configured — otherwise the URL stays a plain proxied URL.
    if (previewPublicJwk && ready) {
      const grant = await signPreviewGrant({
        sandboxId: args.sandboxId,
        // Grant must match AUTH_PORT (public proxy on Vercel app previews).
        port: fixedVercelProxyPort ?? args.port,
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
    vercelSandboxId: v.optional(v.string()),
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
  returns: v.object({
    sandboxId: v.string(),
    vercelSandboxId: v.optional(v.string()),
  }),
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
    const { client, sandboxEnvVars, snapshotName } =
      await resolveSandboxContext(ctx, args.repoId);
    // Vercel sandboxes are only ever reused via `vercelSandboxId` — a stale
    // Daytona `existingSandboxId` on the entity must never be treated as
    // reusable here.
    const existingSandboxId = resolveExistingSandboxId({
      providerKind: client.kind,
      sandboxId: args.existingSandboxId,
      vercelSandboxId: args.vercelSandboxId,
    });
    // Persistence volumes remain a Daytona-only capability; resolve a raw
    // Daytona client just for the volume lookup on that path.
    const sessionVolumeMounts =
      args.sessionPersistenceId && args.sessionPersistenceKind
        ? client.kind === "vercel"
          ? []
          : await ensureSessionPersistenceVolumes(
              getDaytona(
                (await resolveDaytonaApiKey(ctx, args.repoId)).daytonaApiKey,
              ),
              args.repoId,
              args.sessionPersistenceKind,
              args.sessionPersistenceId,
            )
        : undefined;
    console.log(
      `[daytona] prepareSandbox: context resolved in ${Date.now() - setupStartedAt}ms — snapshot=${snapshotName ?? "none"}, volumes=${sessionVolumeMounts?.length ?? 0}, existingSandbox=${existingSandboxId ?? "none"}`,
    );
    let sandbox: SandboxHandle | undefined;
    let deleteSandboxOnFailure = false;
    let attempt = 1;
    const maxSetupAttempts = 3;
    const attachRunSandbox = async (
      sandboxToAttach: SandboxHandle,
    ): Promise<void> => {
      if (!args.attachRunId) {
        return;
      }
      await ctx.runMutation(internal.taskWorkflow.saveSandboxId, {
        runId: args.attachRunId,
        sandboxId: sandboxToAttach.id,
        vercelSandboxId:
          client.kind === "vercel" ? sandboxToAttach.id : undefined,
      });
    };

    while (true) {
      try {
        if (args.ephemeral) {
          const prepared = await createSandboxAndPrepareRepo(
            ctx,
            client,
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
            client,
            existingSandboxId,
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
    return {
      sandboxId: sandbox.id,
      vercelSandboxId: client.kind === "vercel" ? sandbox.id : undefined,
    };
  },
});

/** Creates or resumes a sandbox without performing repo sync. */
export const createOrResumeSandbox = internalAction({
  args: {
    existingSandboxId: v.optional(v.string()),
    vercelSandboxId: v.optional(v.string()),
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
  returns: v.object({
    sandboxId: v.string(),
    vercelSandboxId: v.optional(v.string()),
  }),
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
    const { client, sandboxEnvVars, snapshotName } =
      await resolveSandboxContext(ctx, args.repoId);
    // Vercel sandboxes are only ever reused via `vercelSandboxId` — a stale
    // Daytona `existingSandboxId` on the entity must never be treated as
    // reusable here.
    const existingSandboxId = resolveExistingSandboxId({
      providerKind: client.kind,
      sandboxId: args.existingSandboxId,
      vercelSandboxId: args.vercelSandboxId,
    });
    // Persistence volumes remain a Daytona-only capability; resolve a raw
    // Daytona client just for the volume lookup on that path.
    const sessionVolumeMounts =
      args.sessionPersistenceId && args.sessionPersistenceKind
        ? client.kind === "vercel"
          ? []
          : await ensureSessionPersistenceVolumes(
              getDaytona(
                (await resolveDaytonaApiKey(ctx, args.repoId)).daytonaApiKey,
              ),
              args.repoId,
              args.sessionPersistenceKind,
              args.sessionPersistenceId,
            )
        : undefined;
    console.log(
      `[daytona] createOrResumeSandbox: context resolved in ${Date.now() - setupStartedAt}ms — snapshot=${snapshotName ?? "none"}, volumes=${sessionVolumeMounts?.length ?? 0}, existingSandbox=${existingSandboxId ?? "none"}`,
    );

    let sandbox: SandboxHandle | undefined;
    let deleteSandboxOnFailure = false;
    let attempt = 1;
    const maxSetupAttempts = 3;
    const attachRunSandbox = async (
      sandboxToAttach: SandboxHandle,
    ): Promise<void> => {
      if (!args.attachRunId) {
        return;
      }
      await ctx.runMutation(internal.taskWorkflow.saveSandboxId, {
        runId: args.attachRunId,
        sandboxId: sandboxToAttach.id,
        vercelSandboxId:
          client.kind === "vercel" ? sandboxToAttach.id : undefined,
      });
    };

    while (true) {
      try {
        if (args.ephemeral) {
          const prepared = await createSandboxAndPrepareRepo(
            ctx,
            client,
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
            client,
            existingSandboxId,
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
            vercelSandboxId: client.kind === "vercel" ? sandbox.id : undefined,
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
    return {
      sandboxId: sandbox.id,
      vercelSandboxId: client.kind === "vercel" ? sandbox.id : undefined,
    };
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
    const sandbox = await getSandboxHandle(ctx, args.repoId, args.sandboxId);
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
    const sandbox = await getSandboxHandle(ctx, args.repoId, args.sandboxId);
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
    const sandbox = await getSandboxHandle(ctx, args.repoId, args.sandboxId);
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
    const sandbox = await getSandboxHandle(ctx, args.repoId, args.sandboxId);
    try {
      await pushBranchToOrigin(
        sandbox,
        args.repoOwner,
        args.repoName,
        args.branchName,
        { timeoutSeconds: 90, retryAttempts: 3 },
      );
    } catch (error) {
      console.error(
        `[daytona][execution] pushSandboxBranch failed sandbox=${args.sandboxId} repo=${args.repoOwner}/${args.repoName} branch=${args.branchName}: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Rethrow so callers can surface the failure and preserve the sandbox for
      // recovery. Swallowing here made every caller's error handling dead code.
      throw error;
    }
    return null;
  },
});

type TraitEnvInput = {
  reasoningLevel?: string;
  thinkingEnabled?: boolean;
  use1mContext?: boolean;
};

function buildDaemonOptsSig(
  normalizedModel: string,
  allowedTools: string | undefined,
  providerAccountId: string | undefined,
  traits: TraitEnvInput,
): string {
  return `${normalizedModel}|${allowedTools ?? ""}|${traits.reasoningLevel ?? ""}|${traits.thinkingEnabled === false ? "0" : ""}|${traits.use1mContext === true ? "1" : ""}|${providerAccountId ?? ""}`;
}

function buildTraitEnvVars(traits: TraitEnvInput): Record<string, string> {
  const env: Record<string, string> = {};
  if (traits.reasoningLevel) {
    env.AI_REASONING_EFFORT = traits.reasoningLevel;
  }
  if (traits.thinkingEnabled === false) {
    env.AI_THINKING_ENABLED = "0";
  }
  if (traits.use1mContext === true) {
    env.AI_CONTEXT_1M = "1";
  }
  return env;
}

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
    reasoningLevel: v.optional(reasoningLevelValidator),
    thinkingEnabled: v.optional(v.boolean()),
    use1mContext: v.optional(v.boolean()),
    allowedTools: v.optional(v.string()),
    providerAccountId: v.optional(v.id("userProviderAccounts")),
    sessionPersistenceId: v.optional(sessionPersistenceIdValidator),
  },
  returns: v.object({ prewarmed: v.boolean() }),
  handler: async (ctx, args) => {
    const startedAt = Date.now();
    // The warm daemon only runs in sdk-daemon mode. In CLI mode a prewarm would
    // launch a runner with an empty prompt that nothing consumes (and on the
    // one-shot path would resolve the turn with a blank result), so no-op.
    if (process.env.CLAUDE_ATTEMPT_MODE !== "sdk-daemon") {
      return { prewarmed: false };
    }
    // Defense-in-depth: never touch the sandbox for a closed/stopping session.
    // The exec below lazily resumes a stopped Vercel VM (SDK withResume), so a
    // stray prewarm on a closed session would resurrect it. Callers already
    // guard, but this is the last exec-on-sandbox boundary.
    const session = await ctx.runQuery(internal.sessions.getInternal, {
      id: args.sessionId,
    });
    if (
      !session ||
      session.status === "closed" ||
      session.status === "stopping"
    ) {
      return { prewarmed: false };
    }
    try {
      const sandbox = await getSandboxHandle(ctx, args.repoId, args.sandboxId);
      const sessionIdStr = String(args.sessionId);
      const fp = CALLBACK_SCRIPT_FINGERPRINT;
      const normalizedModel = normalizeAIModel(args.model);
      // sdk-daemon is Claude-only. Launching this path for Cursor/Codex/Opencode
      // falls through to the one-shot runner with an empty prompt and dies as
      // "no parseable stream-json events". Non-Claude session turns are pushed
      // via launchOnExistingSandbox from sessionExecuteWorkflow instead.
      if (getAIModelProvider(normalizedModel) !== "claude") {
        console.log(
          `[daytona][execution] prewarmSessionDaemon: skip non-claude provider sessionId=${args.sessionId} model=${normalizedModel}`,
        );
        return { prewarmed: false };
      }
      // The daemon freezes its model + tool set when it boots, so a daemon
      // started for a different model/tools must be replaced — reusing it would
      // run the turn on the wrong model or without edit tools. The daemon writes
      // this exact signature to /tmp/eva-daemon.opts at boot (via EVA_DAEMON_OPTS
      // below), so the comparison is a literal string match with no drift.
      // Reasoning level and trait toggles are part of the signature: the daemon
      // freezes its effort/thinking/context at boot, so changing them mid-session
      // must respawn the daemon to take effect.
      const optsSig = buildDaemonOptsSig(
        normalizedModel,
        args.allowedTools,
        args.providerAccountId,
        {
          reasoningLevel: args.reasoningLevel,
          thinkingEnabled: args.thinkingEnabled,
          use1mContext: args.use1mContext,
        },
      );
      // Classify the sandbox daemon: alive (reuse), optsmismatch (model/tools
      // changed — kill + respawn), stale (new callback bundle — reupload without
      // killing; the daemon self-exits on the fp change), or cold (launch fresh).
      const alive = await execHandle(
        sandbox,
        `if [ -f /tmp/eva-daemon.pid ] && kill -0 "$(cat /tmp/eva-daemon.pid)" 2>/dev/null && [ "$(cat /tmp/eva-daemon.entity 2>/dev/null)" = ${JSON.stringify(sessionIdStr)} ]; then if [ "$(cat /tmp/eva-callback-fp 2>/dev/null)" = ${JSON.stringify(fp)} ]; then if [ "$(cat /tmp/eva-daemon.opts 2>/dev/null)" = ${JSON.stringify(optsSig)} ]; then echo alive; else echo optsmismatch; fi; else echo stale; fi; else echo cold; fi`,
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
      if (aliveState === "optsmismatch") {
        // Re-read session: startExecute stages pendingTurn then schedules this
        // prewarm. A wrong-model daemon cannot claim a model-tagged pendingTurn,
        // but killing mid-execution (activeWorkflowId, no pendingTurn) would
        // strand the workflow. Respawn when idle or when pendingTurn targets
        // THIS model (wrong live daemon must be replaced).
        const fresh = await ctx.runQuery(internal.sessions.getInternal, {
          id: args.sessionId,
        });
        const pending = fresh?.pendingTurn;
        const midTurnNoPending =
          pending === undefined && fresh?.activeWorkflowId !== undefined;
        if (midTurnNoPending) {
          console.log(
            `[daytona][execution] prewarmSessionDaemon: model/tools mismatch but mid-turn — deferring respawn sessionId=${args.sessionId}`,
          );
          return { prewarmed: false };
        }
        const pendingModel = pending?.model;
        if (
          pendingModel !== undefined &&
          normalizeAIModel(pendingModel) !== normalizedModel
        ) {
          console.log(
            `[daytona][execution] prewarmSessionDaemon: model/tools mismatch, pendingTurn targets different model — deferring respawn sessionId=${args.sessionId} pending=${pendingModel} launch=${normalizedModel}`,
          );
          return { prewarmed: false };
        }
        console.log(
          `[daytona][execution] prewarmSessionDaemon: model/tools changed — respawning daemon sessionId=${args.sessionId}`,
        );
        await execHandle(
          sandbox,
          `kill "$(cat /tmp/eva-daemon.pid 2>/dev/null)" 2>/dev/null; rm -f /tmp/eva-daemon.pid /tmp/eva-daemon.opts; true`,
          10,
        );
      }

      await ensureSandboxRunning(sandbox, {
        timeoutSeconds: ARCHIVED_SANDBOX_READY_TIMEOUT_SECONDS,
      });

      const claudeSessionId =
        getAIModelProvider(normalizedModel) === "claude" &&
        args.sessionPersistenceId
          ? sessionClaudeUuid(args.sessionPersistenceId)
          : undefined;

      // Empty prompt: the daemon in CLAUDE_PREWARM mode never reads it — it waits
      // for the first real message via the pending-turn claim. EVA_DAEMON_OPTS
      // records the frozen model/tools so a later turn can detect a mismatch.
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
          extraEnvVars: {
            CLAUDE_PREWARM: "1",
            EVA_DAEMON_OPTS: optsSig,
            ...buildTraitEnvVars({
              reasoningLevel: args.reasoningLevel,
              thinkingEnabled: args.thinkingEnabled,
              use1mContext: args.use1mContext,
            }),
          },
          claudeSessionId,
          providerAccountId: args.providerAccountId,
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

/** Launches an AI agent script on an existing sandbox with streaming and token setup. */
export const launchOnExistingSandbox = internalAction({
  args: {
    sandboxId: v.string(),
    entityId: v.string(),
    prompt: v.string(),
    userId: v.id("users"),
    completionMutation: v.string(),
    entityIdField: v.string(),
    model: v.optional(v.string()),
    reasoningLevel: v.optional(reasoningLevelValidator),
    thinkingEnabled: v.optional(v.boolean()),
    use1mContext: v.optional(v.boolean()),
    allowedTools: v.optional(v.string()),
    systemPrompt: v.optional(v.string()),
    repoId: v.id("githubRepos"),
    streamingEntityId: v.optional(v.string()),
    runId: v.optional(v.string()),
    sessionPersistenceId: v.optional(sessionPersistenceIdValidator),
    taskProofCaptureEnabled: v.optional(v.boolean()),
    requireTaskCommit: v.optional(v.boolean()),
    providerAccountId: v.optional(v.id("userProviderAccounts")),
    attachmentStorageIds: v.optional(v.array(v.id("_storage"))),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const launchStartedAt = Date.now();
    console.log(
      `[daytona][execution] launchOnExistingSandbox started entityId=${args.entityId} sandboxId=${args.sandboxId} repoId=${args.repoId}`,
    );
    const sandbox = await getSandboxHandle(ctx, args.repoId, args.sandboxId);

    // Download any user-attached input images into the sandbox and point the
    // agent at them via a prompt note (the CLI providers read files by path).
    let prompt = args.prompt;
    if (args.attachmentStorageIds && args.attachmentStorageIds.length > 0) {
      const paths = await materializeAttachmentsToSandbox(
        ctx,
        sandbox,
        args.attachmentStorageIds,
      );
      prompt += buildAttachmentPromptNote(paths);
    }

    await execHandle(sandbox, KILL_PRIOR_AGENT_PROCESSES_CMD, 10);
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
    // Session-wide trait overrides. Only non-default values are sent from the UI;
    // the runner maps effort to each provider's native control (see config.ts).
    Object.assign(
      extraEnvVars,
      buildTraitEnvVars({
        reasoningLevel: args.reasoningLevel,
        thinkingEnabled: args.thinkingEnabled,
        use1mContext: args.use1mContext,
      }),
    );
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
      prompt,
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
        providerAccountId: args.providerAccountId,
        enableMcp: true,
      },
    );
    console.log(
      `[daytona][execution] launchOnExistingSandbox finished in ${Date.now() - launchStartedAt}ms entityId=${args.entityId} sandboxId=${args.sandboxId}`,
    );

    return null;
  },
});
