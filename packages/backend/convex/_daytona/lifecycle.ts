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
    const pidAlive = await exec(
      sandbox,
      'test -f /tmp/run-design.pid && kill -0 "$(cat /tmp/run-design.pid)" 2>/dev/null',
      5,
    )
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
    return null;
  },
});
