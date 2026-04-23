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
 * callback runner PID is still alive. If both are true we grant a single
 * grace cycle (re-schedule `checkStaleRuns` after `STALE_RECHECK_MS` with
 * `skipLivenessProbe: true`) so a transient heartbeat transport failure does
 * not kill a run that is demonstrably doing work. If the probe confirms the
 * sandbox is dead we schedule `checkStaleRuns` with `skipLivenessProbe: true`
 * immediately so the kill happens without re-probing.
 *
 * The probe is intentionally a one-shot per stale event: granting more than
 * one grace cycle risks keeping zombie runs alive indefinitely. The hard
 * 2-hour `handleStaleRun` timeout is the backstop.
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
      // Grant one grace cycle. Next `checkStaleRuns` runs with skipLivenessProbe=true
      // so it will kill immediately if the run is still stale. If the heartbeat
      // recovered during the grace window the streamingActivity row will be
      // fresh and the check will pass normally.
      await ctx.scheduler.runAfter(
        STALE_RECHECK_MS,
        internal.taskWorkflow.checkStaleRuns,
        {
          runId: args.runId,
          taskId: args.taskId,
          skipLivenessProbe: true,
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
