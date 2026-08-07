"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import {
  execHandle,
  getSandboxHandle,
  KILL_PRIOR_AGENT_PROCESSES_CMD,
} from "./helpers";
import { releaseSwapFile } from "./swap";
import {
  LEGACY_RUNNER_DONE_FILE,
  LEGACY_RUNNER_PID_FILE,
  RUNNER_DONE_GLOB,
  RUNNER_PID_GLOB,
} from "./daemonPaths";

/**
 * Exits 0 while some runner in this sandbox is still alive.
 *
 * Markers are entity-scoped now, and this probe only knows a sandbox id, so it
 * sweeps every runner pidfile and pairs each with its own done file — a done
 * file from a different entity must not retire a live runner. Zombies count as
 * dead: a reaped-but-unwaited process answers `kill -0` and would otherwise
 * hold the watchdog off forever.
 */
const CALLBACK_LIVENESS_COMMAND = [
  "alive=1",
  `for f in ${RUNNER_PID_GLOB} ${LEGACY_RUNNER_PID_FILE}; do`,
  '  [ -f "$f" ] || continue',
  `  case "$f" in ${LEGACY_RUNNER_PID_FILE}) done_file=${LEGACY_RUNNER_DONE_FILE} ;; *) done_file="\${f%.pid}.done" ;; esac`,
  '  [ -f "$done_file" ] && continue',
  '  pid="$(cat "$f" 2>/dev/null || true)"',
  '  [ -n "$pid" ] || continue',
  '  kill -0 "$pid" 2>/dev/null || continue',
  '  state="$(ps -p "$pid" -o stat= 2>/dev/null | tr -d " ")"',
  '  case "$state" in Z*) continue ;; esac',
  "  alive=0",
  "done",
  "exit $alive",
].join("\n");
/** Agent still running even if callback PID bookkeeping is stale. Cursor runs
 * in-process inside the callback (run-design.mjs) since the SDK migration, so
 * the callback process itself counts as agent liveness; cursor-agent stays for
 * pre-migration sandboxes. */
const AGENT_PROCESS_LIVENESS_COMMAND =
  "pgrep -f 'claude-code|cursor-agent|codex run|opencode run|/\\.claude/|run-design\\.mjs' >/dev/null 2>&1";

/**
 * Verifies whether a sandbox and its callback runner are alive.
 *
 * Used by the lease reconcilers to word the alert, never to spare the turn. A
 * lapsed lease is already the verdict; all this answers is whether the sandbox
 * is gone ("its sandbox was stopped") or merely silent ("lease expired"). It
 * deliberately cannot grant a reprieve: the old probe touched the streaming row
 * when a pid looked alive, which reset the staleness clock of the very check
 * sent to kill it and let a zombie run indefinitely.
 *
 * Conservative failure handling: if we cannot reach the sandbox to determine
 * state, we report `alive: true` with reason `probe_unreachable`, which reads as
 * "not demonstrably stopped" and leaves the wording generic.
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
    const sandbox = await getSandboxHandle(
      ctx,
      args.repoId,
      args.sandboxId,
    ).catch((err: Error) => {
      console.log(
        `[watchdog][liveness] sandboxId=${args.sandboxId} probe_unreachable (getSandbox failed): ${err.message}`,
      );
      return null;
    });
    if (!sandbox) {
      return {
        alive: true,
        reason: "probe_unreachable_get_sandbox",
      };
    }

    const refreshOk = await sandbox
      .refresh()
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
    // Anything that is not "running" means the callback cannot possibly be
    // running. Not started => not alive, and the watchdog should proceed to
    // clean up.
    if (state !== "running") {
      return {
        alive: false,
        reason: "sandbox_not_started",
        sandboxState: state,
      };
    }

    // Sandbox is started — verify the callback runner PID is still alive.
    // Short timeout so we never block the watchdog path on exec hangs.
    const pidAlive = await execHandle(sandbox, CALLBACK_LIVENESS_COMMAND, 5)
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

    const agentAlive = await execHandle(
      sandbox,
      AGENT_PROCESS_LIVENESS_COMMAND,
      5,
    )
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
      const sandbox = await getSandboxHandle(ctx, args.repoId, args.sandboxId);
      await execHandle(sandbox, KILL_PRIOR_AGENT_PROCESSES_CMD, 10);
    } catch {
      // Sandbox may already be stopped/deleted
    }
    return null;
  },
});

/** Stops a sandbox (preserves state, fast resume). */
export const stopSandbox = internalAction({
  args: { sandboxId: v.string(), repoId: v.id("githubRepos") },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const sandbox = await getSandboxHandle(ctx, args.repoId, args.sandboxId);
      // Stop auto-snapshots the filesystem — drop the swapfile first so the
      // resume image does not carry GBs the next boot recreates for free.
      await releaseSwapFile(sandbox);
      await sandbox.stop();
      console.log(`[sandbox] stopSandbox ok sandboxId=${args.sandboxId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // Already gone / already idle — treat as success so finalize can close.
      const benign =
        /already.?stopped|not found|does not exist|no active session|destroyed|gone/i.test(
          message,
        ) && !/did not reach a terminal stopped state/i.test(message);
      if (benign) {
        console.log(
          `[sandbox] stopSandbox ignored benign error for ${args.sandboxId}: ${message}`,
        );
        return null;
      }
      // Real stop failures must propagate — swallowing them made Eva mark the
      // session closed while Vercel still showed running.
      console.error(
        `[sandbox] stopSandbox failed for ${args.sandboxId}: ${message}`,
      );
      throw error instanceof Error ? error : new Error(message);
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
  `cat ${RUNNER_DONE_GLOB} ${LEGACY_RUNNER_DONE_FILE} 2>/dev/null || echo '(missing: callback died without running its exit handler, e.g. SIGKILL/OOM)'`,
  "echo; echo '--- callback log tail ---'",
  "tail -n 30 /tmp/design.log 2>/dev/null || true",
].join("; ");

/**
 * Captures post-mortem diagnostics from a sandbox whose run was killed by the
 * watchdog, persists them on the run, then stops (not deletes) the sandbox.
 * Quick-task sandboxes are persistent — the paused filesystem keeps any
 * uncommitted work and unpushed commits recoverable, and the next run resumes
 * it. Capture is best-effort — the stop proceeds regardless.
 */
export const captureDiagnosticsAndStopSandbox = internalAction({
  args: {
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
    runId: v.id("agentRuns"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const sandbox = await getSandboxHandle(ctx, args.repoId, args.sandboxId);
      const diagnostics = await execHandle(
        sandbox,
        KILL_DIAGNOSTICS_COMMAND,
        15,
      );
      const trimmed = diagnostics.trim().slice(0, 4000);
      console.log(
        `[watchdog][diagnostics] runId=${args.runId} sandboxId=${args.sandboxId}\n${trimmed}`,
      );
      await ctx.runMutation(internal.taskWorkflow.appendRunLog, {
        runId: args.runId,
        message: `Sandbox diagnostics captured before stop:\n${trimmed}`,
      });
    } catch (error) {
      console.log(
        `[watchdog][diagnostics] runId=${args.runId} capture failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    await ctx.runAction(internal.sandbox.stopSandbox, {
      sandboxId: args.sandboxId,
      repoId: args.repoId,
    });
    return null;
  },
});

/** Deletes a sandbox, silently ignoring already-deleted sandboxes. */
export const deleteSandbox = internalAction({
  args: { sandboxId: v.string(), repoId: v.id("githubRepos") },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const sandbox = await getSandboxHandle(ctx, args.repoId, args.sandboxId);
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

/** Archives a sandbox (stops first if running, then moves to cold storage). */
export const archiveSandbox = internalAction({
  args: { sandboxId: v.string(), repoId: v.id("githubRepos") },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const sandbox = await getSandboxHandle(ctx, args.repoId, args.sandboxId);
      await sandbox.refresh();
      const state = sandbox.state;
      console.log(
        `[sandbox] Archiving sandbox ${args.sandboxId}, current state: ${state}`,
      );

      // Already archived - nothing to do
      if (state === "archived") {
        console.log(`[sandbox] Sandbox ${args.sandboxId} already archived`);
        return null;
      }

      // Stop first if currently running (archive requires stopped state)
      if (state === "running") {
        await releaseSwapFile(sandbox);
        await sandbox.stop();
        console.log(`[sandbox] Stopped sandbox ${args.sandboxId}`);
      }

      await sandbox.archive();
      console.log(`[sandbox] Archived sandbox ${args.sandboxId}`);
    } catch (error) {
      // Sandbox may already be archived, stopped, or deleted
      console.warn(
        `[sandbox] Failed to archive sandbox ${args.sandboxId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    return null;
  },
});

/** Returns the active sandbox provider for a repo (for workflow thaw id selection). Vercel is the only provider. */
export const getSandboxProviderKind = internalAction({
  args: { repoId: v.id("githubRepos") },
  returns: v.literal("vercel"),
  handler: async () => "vercel" as const,
});

/**
 * Provider for a snapshot config. Vercel is the only provider, so this
 * always resolves "vercel"; kept as an internalAction (name unchanged) since
 * it is still part of the public `internal.sandbox.*` surface.
 */
export const getSnapshotSandboxProviderKind = internalAction({
  args: { repoSnapshotId: v.id("repoSnapshots") },
  returns: v.literal("vercel"),
  handler: async () => "vercel" as const,
});
