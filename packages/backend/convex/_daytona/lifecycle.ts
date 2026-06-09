"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import {
  exec,
  resolveSandboxContext,
  getSandbox,
  sleep,
  WARMING_SANDBOX_READY_TIMEOUT_SECONDS,
} from "./helpers";
import { createSandbox, WARMING_LIFECYCLE } from "./git";

const MAX_WARMUP_RETRIES = 2;
const WARMUP_RETRY_DELAY_MS = 5_000;
const CALLBACK_LIVENESS_COMMAND = [
  "test -f /tmp/run-design.pid",
  "test ! -f /tmp/run-design.done",
  'pid="$(cat /tmp/run-design.pid)"',
  'kill -0 "$pid" 2>/dev/null',
  'state="$(ps -p "$pid" -o stat= 2>/dev/null | tr -d " ")"',
  'case "$state" in Z*) exit 1 ;; *) exit 0 ;; esac',
].join(" && ");
/** Agent CLI still running even if callback PID bookkeeping is stale. */
const AGENT_PROCESS_LIVENESS_COMMAND =
  "pgrep -f 'claude-code|cursor-agent|codex run|opencode run|/\\.claude/' >/dev/null 2>&1";

/** Warms the Daytona snapshot cache for a repo by creating and immediately deleting a sandbox, with retries. */
export const warmSnapshotCache = internalAction({
  args: {
    repoId: v.id("githubRepos"),
    buildId: v.id("snapshotBuilds"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { daytona, sandboxEnvVars, snapshotName } =
      await resolveSandboxContext(ctx, args.repoId);
    if (!snapshotName) return null;
    const repo = await ctx.runQuery(internal.repoSnapshots.getRepo, {
      repoId: args.repoId,
    });
    if (!repo) return null;

    let lastError = "";
    for (let attempt = 0; attempt <= MAX_WARMUP_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          console.log(
            `[daytona] Warmup retry ${attempt}/${MAX_WARMUP_RETRIES} for ${repo.owner}/${repo.name}`,
          );
          await sleep(WARMUP_RETRY_DELAY_MS);
        }
        const sandbox = await createSandbox(
          daytona,
          repo.installationId,
          sandboxEnvVars,
          WARMING_LIFECYCLE,
          snapshotName,
          undefined,
          WARMING_SANDBOX_READY_TIMEOUT_SECONDS,
        );
        await sandbox.delete();
        console.log(
          `[daytona] Warmed snapshot cache for ${repo.owner}/${repo.name}`,
        );
        await ctx.runMutation(internal.repoSnapshots.updateWarmupStatus, {
          buildId: args.buildId,
          status: "success",
        });
        return null;
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        console.error(
          `[daytona] warmSnapshotCache attempt ${attempt + 1} failed:`,
          lastError,
        );
      }
    }

    await ctx.runMutation(internal.repoSnapshots.updateWarmupStatus, {
      buildId: args.buildId,
      status: "error",
      error: lastError,
    });
    return null;
  },
});

/**
 * Verifies whether a sandbox and its callback runner are alive.
 *
 * Used as a pre-kill liveness gate by the watchdog. When the streaming heartbeat
 * has gone stale but the sandbox + callback PID are still demonstrably alive,
 * the caller can grant a single grace cycle instead of killing immediately. This
 * protects against transient heartbeat transport failures (Convex auth flaps,
 * brief network issues) where the run itself is still healthy.
 *
 * Conservative failure handling: if we cannot reach Daytona to determine state,
 * we report `alive: true` with reason `probe_unreachable` so the watchdog does
 * NOT kill on our inability to verify. The hard 2-hour timeout (`handleStaleRun`)
 * remains a backstop.
 */
export const verifySandboxLiveness = internalAction({
  args: {
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
  },
  returns: v.object({
    alive: v.boolean(),
    reason: v.string(),
    sandboxState: v.optional(v.string()),
    pidAlive: v.optional(v.boolean()),
  }),
  handler: async (ctx, args) => {
    const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId).catch(
      (err: Error) => {
        console.log(
          `[watchdog][liveness] sandboxId=${args.sandboxId} probe_unreachable (getSandbox failed): ${err.message}`,
        );
        return null;
      },
    );
    if (!sandbox) {
      return {
        alive: true,
        reason: "probe_unreachable_get_sandbox",
      };
    }

    const refreshOk = await sandbox
      .refreshData()
      .then(() => true)
      .catch((err: Error) => {
        console.log(
          `[watchdog][liveness] sandboxId=${args.sandboxId} probe_unreachable (refreshData failed): ${err.message}`,
        );
        return false;
      });
    if (!refreshOk) {
      return {
        alive: true,
        reason: "probe_unreachable_refresh",
      };
    }

    const state = sandbox.state;
    // Anything that is not "started" means the callback cannot possibly be
    // running. Not started => not alive, and the watchdog should proceed to
    // clean up.
    if (state !== "started") {
      return {
        alive: false,
        reason: "sandbox_not_started",
        sandboxState: state ?? "unknown",
      };
    }

    // Sandbox is started — verify the callback runner PID is still alive.
    // Short timeout so we never block the watchdog path on exec hangs.
    const pidAlive = await exec(sandbox, CALLBACK_LIVENESS_COMMAND, 5)
      .then(() => true)
      .catch(() => false);

    if (pidAlive) {
      return {
        alive: true,
        reason: "sandbox_started_pid_alive",
        sandboxState: state,
        pidAlive: true,
      };
    }

    const agentAlive = await exec(sandbox, AGENT_PROCESS_LIVENESS_COMMAND, 5)
      .then(() => true)
      .catch(() => false);
    if (agentAlive) {
      return {
        alive: true,
        reason: "agent_process_running_callback_pid_stale",
        sandboxState: state,
        pidAlive: false,
      };
    }

    // Exec failing on a started sandbox most likely means the PID is dead
    // (test/kill returned non-zero). Treat as dead so the watchdog cleans up.
    return {
      alive: false,
      reason: "pid_dead_or_exec_failed",
      sandboxState: state,
      pidAlive: false,
    };
  },
});

/** Kills running CLI processes (claude-code, codex, run-design) inside a sandbox. */
export const killSandboxProcess = internalAction({
  args: {
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);
      await exec(
        sandbox,
        "pkill -f 'claude-code' 2>/dev/null; pkill -f 'codex' 2>/dev/null; pkill -f 'opencode' 2>/dev/null; pkill -f 'cursor-agent' 2>/dev/null; pkill -f 'run-design.mjs' 2>/dev/null; true",
        10,
      );
    } catch {
      // Sandbox may already be stopped/deleted
    }
    return null;
  },
});

/** Stops a Daytona sandbox (preserves state, fast resume). Silently ignores already-stopped sandboxes. */
export const stopSandbox = internalAction({
  args: { sandboxId: v.string(), repoId: v.id("githubRepos") },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);
      await sandbox.stop();
    } catch {
      // Sandbox may already be stopped, archived, or deleted
    }
    return null;
  },
});

// Evidence of why a run's callback process died, gathered before the sandbox
// (and with it /tmp and the kernel log) is destroyed. The dmesg grep directly
// confirms or rules out OOM kills; a missing done file means the callback was
// SIGKILLed (its exit handler never ran); the log tail shows its last words.
const KILL_DIAGNOSTICS_COMMAND = [
  "echo '--- oom (dmesg) ---'",
  "(dmesg 2>/dev/null | grep -iE 'out of memory|oom[-_ ]kill|killed process' | tail -n 12) || true",
  "echo '--- done file ---'",
  "cat /tmp/run-design.done 2>/dev/null || echo '(missing: callback died without running its exit handler, e.g. SIGKILL/OOM)'",
  "echo; echo '--- callback log tail ---'",
  "tail -n 30 /tmp/design.log 2>/dev/null || true",
].join("; ");

/**
 * Captures post-mortem diagnostics from a sandbox whose run was killed by the
 * watchdog, persists them on the run, then deletes the sandbox. Capture is
 * best-effort — deletion proceeds regardless so cleanup never leaks capacity.
 */
export const captureDiagnosticsAndDeleteSandbox = internalAction({
  args: {
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
    runId: v.id("agentRuns"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);
      const diagnostics = await exec(sandbox, KILL_DIAGNOSTICS_COMMAND, 15);
      const trimmed = diagnostics.trim().slice(0, 4000);
      console.log(
        `[watchdog][diagnostics] runId=${args.runId} sandboxId=${args.sandboxId}\n${trimmed}`,
      );
      await ctx.runMutation(internal.taskWorkflow.appendRunLog, {
        runId: args.runId,
        message: `Sandbox diagnostics captured before deletion:\n${trimmed}`,
      });
    } catch (error) {
      console.log(
        `[watchdog][diagnostics] runId=${args.runId} capture failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    await ctx.runAction(internal.daytona.deleteSandbox, {
      sandboxId: args.sandboxId,
      repoId: args.repoId,
    });
    return null;
  },
});

/** Deletes a Daytona sandbox, silently ignoring already-deleted sandboxes. */
export const deleteSandbox = internalAction({
  args: { sandboxId: v.string(), repoId: v.id("githubRepos") },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);
      await sandbox.delete();
    } catch {
      // Sandbox may already be deleted or expired
    }
    // Best-effort cleanup of the credential-helper row. No-op if absent.
    await ctx.runMutation(internal.sandboxGitCredentials.deleteBySandboxId, {
      sandboxId: args.sandboxId,
    });
    return null;
  },
});

/** Archives a Daytona sandbox (stops first if running, then moves to cold storage). */
export const archiveSandbox = internalAction({
  args: { sandboxId: v.string(), repoId: v.id("githubRepos") },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);
      await sandbox.refreshData();
      const state = sandbox.state;
      console.log(
        `[daytona] Archiving sandbox ${args.sandboxId}, current state: ${state}`,
      );

      // Already archived - nothing to do
      if (state === "archived") {
        console.log(`[daytona] Sandbox ${args.sandboxId} already archived`);
        return null;
      }

      // Stop first if currently running (archive requires stopped state)
      if (state === "started") {
        await sandbox.stop();
        console.log(`[daytona] Stopped sandbox ${args.sandboxId}`);
      }

      await sandbox.archive();
      console.log(`[daytona] Archived sandbox ${args.sandboxId}`);
    } catch (error) {
      // Sandbox may already be archived, stopped, or deleted
      console.warn(
        `[daytona] Failed to archive sandbox ${args.sandboxId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    return null;
  },
});
