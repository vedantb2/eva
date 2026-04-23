"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { STALE_RECHECK_MS } from "./recovery";

/**
 * Pre-kill liveness probe for stale runs.
 *
 * When `checkStaleRuns` detects staleness on a run that has a sandbox attached,
 * it schedules this probe instead of killing immediately. The probe asks
 * Daytona whether the sandbox is still in the `started` state AND whether the
 * callback runner PID is still alive. If both are true we re-schedule
 * `checkStaleRuns` after `STALE_RECHECK_MS` without skipping probes so the next
 * stale check re-validates liveness again instead of doing a blind kill.
 * If the probe confirms the sandbox is dead we schedule `checkStaleRuns` with
 * `skipLivenessProbe: true` immediately so the kill happens without re-probing.
 *
 * This keeps false kills from heartbeat transport flaps from terminating live
 * work. The hard 2-hour `handleStaleRun` timeout remains the ultimate backstop.
 */
export const probeStaleRunLiveness = internalAction({
  args: {
    runId: v.id("agentRuns"),
    taskId: v.id("agentTasks"),
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
    streamingAgeMs: v.number(),
    finishingInProgress: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const probeStartedAt = Date.now();
    const liveness = await ctx.runAction(
      internal.daytona.verifySandboxLiveness,
      { sandboxId: args.sandboxId, repoId: args.repoId },
    );
    const probeDurationMs = Date.now() - probeStartedAt;

    console.log(
      `[watchdog][probe] runId=${args.runId} alive=${liveness.alive} reason=${liveness.reason} sandboxState=${liveness.sandboxState ?? "unknown"} pidAlive=${liveness.pidAlive ?? "n/a"} streamingAgeMs=${args.streamingAgeMs} finishing=${args.finishingInProgress} probeDurationMs=${probeDurationMs}`,
    );

    if (liveness.alive) {
      // Re-check later and probe again if still stale.
      await ctx.scheduler.runAfter(
        STALE_RECHECK_MS,
        internal.taskWorkflow.checkStaleRuns,
        {
          runId: args.runId,
          taskId: args.taskId,
        },
      );
      return null;
    }

    // Confirmed dead — re-enter checkStaleRuns immediately with the probe
    // suppressed so the kill path runs without another round-trip.
    await ctx.scheduler.runAfter(0, internal.taskWorkflow.checkStaleRuns, {
      runId: args.runId,
      taskId: args.taskId,
      skipLivenessProbe: true,
    });
    return null;
  },
});
