"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { STALE_RECHECK_MS } from "./recovery";
import { staleProbeFollowUp } from "./staleness";
import { getTaskRunStreamingEntityId } from "./helpers";

/**
 * Pre-kill liveness probe for stale runs.
 *
 * When `checkStaleRuns` detects staleness on a run that has a sandbox attached,
 * it schedules this probe instead of killing immediately. The probe asks the
 * sandbox provider whether the sandbox is still in the `started` state AND
 * whether the callback runner PID is still alive. Confirmed alive → touch the
 * streaming row and re-schedule `checkStaleRuns` after `STALE_RECHECK_MS`
 * without skipping probes, so the next stale check re-validates liveness
 * instead of doing a blind kill. Confirmed dead → schedule `checkStaleRuns`
 * with `skipLivenessProbe: true` immediately so the kill happens without
 * re-probing. Unreachable → re-check WITHOUT touching, so an unverifiable run
 * dies at STALE_UNVERIFIED_KILL_THRESHOLD_MS (see staleProbeFollowUp) instead
 * of hanging until the 2-hour `handleStaleRun` backstop.
 *
 * This keeps false kills from heartbeat transport flaps from terminating live
 * work.
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
      internal.sandbox.verifySandboxLiveness,
      { sandboxId: args.sandboxId, repoId: args.repoId },
    );
    const probeDurationMs = Date.now() - probeStartedAt;

    console.log(
      `[watchdog][probe] runId=${args.runId} alive=${liveness.alive} reason=${liveness.reason} sandboxState=${liveness.sandboxState ?? "unknown"} pidAlive=${liveness.pidAlive ?? "n/a"} streamingAgeMs=${args.streamingAgeMs} finishing=${args.finishingInProgress} probeDurationMs=${probeDurationMs}`,
    );

    const followUp = staleProbeFollowUp({
      alive: liveness.alive,
      reason: liveness.reason,
      streamingAgeMs: args.streamingAgeMs,
    });

    if (followUp === "confirmed_alive") {
      const entityId = getTaskRunStreamingEntityId(args.runId);
      await ctx.runMutation(internal.streaming.internalTouch, { entityId });
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

    if (followUp === "await_verification") {
      // No touch: the staleness clock keeps running toward the unverified
      // kill ceiling while the provider API is unreachable.
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

    // Confirmed dead (or unverifiable past the kill ceiling) — re-enter
    // checkStaleRuns immediately with the probe suppressed so the kill path
    // runs without another round-trip.
    await ctx.scheduler.runAfter(0, internal.taskWorkflow.checkStaleRuns, {
      runId: args.runId,
      taskId: args.taskId,
      skipLivenessProbe: true,
    });
    return null;
  },
});
