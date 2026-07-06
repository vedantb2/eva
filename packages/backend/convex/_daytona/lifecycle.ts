"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { execHandle, getSandboxHandle } from "./helpers";

/**
 * Short wait window for the start kick-off. A stopped→started fast resume
 * completes inside this window; an archived cold-storage thaw will not, and that
 * is expected — the thaw continues server-side on Daytona and is then observed
 * via pollSandboxStarted.
 */
const KICKOFF_START_WAIT_SECONDS = 30;
/** States from which a sandbox can never reach "running" — fail fast on these. */
const TERMINAL_FAILURE_STATES = ["error", "gone"];
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
      await execHandle(
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
      const sandbox = await getSandboxHandle(ctx, args.repoId, args.sandboxId);
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
    await ctx.runAction(internal.daytona.stopSandbox, {
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

/** Archives a Daytona sandbox (stops first if running, then moves to cold storage). */
export const archiveSandbox = internalAction({
  args: { sandboxId: v.string(), repoId: v.id("githubRepos") },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const sandbox = await getSandboxHandle(ctx, args.repoId, args.sandboxId);
      await sandbox.refresh();
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
      if (state === "running") {
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

/**
 * Issues a start request for a sandbox and returns the observed state WITHOUT
 * blocking on a full cold-storage thaw.
 *
 * Archived sandboxes rehydrate from object storage, which can take well over 10
 * minutes — waiting inline would blow the Convex per-action time limit. So this
 * fires the start (the thaw then proceeds server-side on Daytona) with only a
 * short wait window: a stopped→started fast resume completes here and returns
 * "running"; an archived thaw times out the wait (expected) and returns the
 * in-progress state so the caller can poll via pollSandboxStarted. Throws only
 * when the sandbox is in a terminal failure state.
 */
export const startSandboxAsyncKickoff = internalAction({
  args: { sandboxId: v.string(), repoId: v.id("githubRepos") },
  returns: v.object({ state: v.string() }),
  handler: async (ctx, args) => {
    const sandbox = await getSandboxHandle(ctx, args.repoId, args.sandboxId);
    await sandbox.refresh();
    if (sandbox.state === "running") {
      return { state: "running" };
    }
    try {
      // start() POSTs the start request, then waits up to the given window. The
      // POST returns fast; for a cold thaw the wait times out and throws — the
      // restore keeps running on Daytona regardless.
      await sandbox.start(KICKOFF_START_WAIT_SECONDS);
    } catch (error) {
      console.log(
        `[daytona] startSandboxAsyncKickoff: start() did not complete within ${KICKOFF_START_WAIT_SECONDS}s for ${args.sandboxId} (expected for a cold thaw): ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    await sandbox.refresh();
    const state = sandbox.state;
    if (TERMINAL_FAILURE_STATES.includes(state)) {
      throw new Error(
        `Sandbox ${args.sandboxId} is in terminal state "${state}": ${sandbox.errorReason ?? "no reason given"}`,
      );
    }
    console.log(
      `[daytona] startSandboxAsyncKickoff: sandbox ${args.sandboxId} state after kick-off = ${state}`,
    );
    return { state };
  },
});

/**
 * Single poll of a sandbox's state, used by the cold-storage thaw workflow loop
 * (ensureSandboxStartedSteps). Returns the current state; throws if the sandbox
 * has reached a terminal failure state so the workflow can stop early instead of
 * polling all the way to its ceiling.
 */
export const pollSandboxStarted = internalAction({
  args: { sandboxId: v.string(), repoId: v.id("githubRepos") },
  returns: v.object({ state: v.string() }),
  handler: async (ctx, args) => {
    const sandbox = await getSandboxHandle(ctx, args.repoId, args.sandboxId);
    await sandbox.refresh();
    const state = sandbox.state;
    if (TERMINAL_FAILURE_STATES.includes(state)) {
      throw new Error(
        `Sandbox ${args.sandboxId} reached terminal state "${state}" during restore: ${sandbox.errorReason ?? "no reason given"}`,
      );
    }
    return { state };
  },
});
