import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import type { WorkflowId } from "@convex-dev/workflow";
import { workflow } from "../workflowManager";
import { buildTaskDoneEvent } from "./events";
import {
  cleanUpStaleRun,
  STALE_THRESHOLD_MS,
  STALE_RECHECK_MS,
  STALE_FINISHING_THRESHOLD_MS,
  STALE_NO_SANDBOX_THRESHOLD_MS,
} from "./recovery";
import {
  clearStreamingActivity,
  getTaskAuditStreamingEntityId,
  getTaskRunStreamingEntityId,
  snapshotStreamingActivityToLog,
} from "./helpers";

const SANDBOX_STARTUP_LABELS = new Set([
  "Starting sandbox...",
  "Creating sandbox...",
  "Resuming sandbox...",
  "Syncing repository...",
  "Cloning repository...",
  "Installing dependencies...",
  "Fetching base branch...",
  "Checking out base branch...",
  "Setting up branch...",
  "Starting desktop...",
  "Retrying sandbox setup...",
]);

type StreamingStep = {
  label?: string;
  status?: string;
};

/** Parses streaming activity JSON and returns labels of steps with "active" status. */
function getActiveStreamingLabels(
  currentActivity: string | undefined,
): string[] {
  if (!currentActivity) {
    return [];
  }
  try {
    const parsed = JSON.parse(currentActivity);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.flatMap((item) => {
      if (
        item &&
        typeof item === "object" &&
        "label" in item &&
        "status" in item &&
        typeof item.label === "string" &&
        typeof item.status === "string" &&
        item.status === "active"
      ) {
        const step: StreamingStep = item;
        return step.label ? [step.label] : [];
      }
      return [];
    });
  } catch {
    return [];
  }
}

/** Returns true if the current streaming activity indicates sandbox startup is still in progress. */
function isSandboxStartupActivity(
  currentActivity: string | undefined,
): boolean {
  if (!currentActivity) {
    return true;
  }
  const activeLabels = getActiveStreamingLabels(currentActivity);
  if (activeLabels.some((label) => SANDBOX_STARTUP_LABELS.has(label))) {
    return true;
  }
  return currentActivity.includes('"Starting sandbox..."');
}

/** Returns true if the current streaming activity indicates the run is finalizing. */
function isFinalizingActivity(currentActivity: string | undefined): boolean {
  if (!currentActivity) {
    return false;
  }
  return currentActivity.includes('"Finalizing response..."');
}
/**
 * Periodically checks if a run has gone stale and cleans it up or reschedules another check.
 *
 * Liveness gate: when a run is stale but has a sandbox attached, we first schedule
 * a one-time liveness probe (`verifySandboxLiveness`) before killing. The probe
 * checks the sandbox state + callback PID. If both are alive the run gets one
 * grace cycle (another `STALE_RECHECK_MS` window with `skipLivenessProbe: true`)
 * so transient heartbeat transport failures do not kill a demonstrably-live run.
 * If still stale at the end of that grace cycle the kill proceeds. The hard
 * 2-hour `handleStaleRun` timeout is the ultimate backstop.
 */
export const checkStaleRuns = internalMutation({
  args: {
    runId: v.id("agentRuns"),
    taskId: v.id("agentTasks"),
    // Set by the liveness probe when it already granted a grace cycle for the
    // current stale event. Suppresses a second probe so we can't loop forever
    // on a sandbox that is alive-but-zombie.
    skipLivenessProbe: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run || run.status !== "running") return null;

    const task = await ctx.db.get(args.taskId);
    if (!task) return null;

    if (!task.activeWorkflowId) {
      console.log(
        `[watchdog][kill] runId=${args.runId} reason=workflow_tracking_lost skipProbe=${args.skipLivenessProbe ?? false}`,
      );
      await cleanUpStaleRun(ctx, {
        taskId: args.taskId,
        runId: args.runId,
        isProjectTask: !!task.projectId,
        errorMessage: "Run killed by watchdog: workflow tracking lost",
        exitReason: "workflow_tracking_lost",
        taskStatus: task.status,
      });
      return null;
    }

    if (!run.sandboxId) {
      const startedAt = run.startedAt ?? Date.now();
      const sandboxAttachTimedOut =
        Date.now() - startedAt > STALE_NO_SANDBOX_THRESHOLD_MS;

      if (!sandboxAttachTimedOut) {
        await ctx.scheduler.runAfter(
          STALE_RECHECK_MS,
          internal.taskWorkflow.checkStaleRuns,
          { runId: args.runId, taskId: args.taskId },
        );
        return null;
      }

      console.log(
        `[watchdog][kill] runId=${args.runId} reason=watchdog_no_sandbox ageSinceStart=${Date.now() - startedAt}ms`,
      );
      await cleanUpStaleRun(ctx, {
        taskId: args.taskId,
        runId: args.runId,
        isProjectTask: !!task.projectId,
        errorMessage: "Run killed by watchdog: sandbox was never attached",
        exitReason: "watchdog_no_sandbox",
        activeWorkflowId: task.activeWorkflowId,
        taskStatus: task.status,
      });
      return null;
    }

    const streaming = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) =>
        q.eq("entityId", getTaskRunStreamingEntityId(args.runId)),
      )
      .first();
    const startupStillInProgress = isSandboxStartupActivity(
      streaming?.currentActivity,
    );
    const finishingInProgress =
      run.finalizingAt !== undefined ||
      isFinalizingActivity(streaming?.currentActivity);
    const lastActivity = Math.max(
      streaming?.lastUpdatedAt ?? 0,
      run.startedAt ?? 0,
      run.finalizingAt ?? 0,
    );
    const staleThresholdMs = startupStillInProgress
      ? STALE_NO_SANDBOX_THRESHOLD_MS
      : finishingInProgress
        ? STALE_FINISHING_THRESHOLD_MS
        : STALE_THRESHOLD_MS;
    const staleSeconds = Math.round(staleThresholdMs / 1000);
    const streamingAgeMs = Date.now() - lastActivity;
    const isStale = streamingAgeMs > staleThresholdMs;

    if (!isStale) {
      await ctx.scheduler.runAfter(
        STALE_RECHECK_MS,
        internal.taskWorkflow.checkStaleRuns,
        { runId: args.runId, taskId: args.taskId },
      );
      return null;
    }

    // Stale. If we have a sandbox + haven't probed yet + we're not in the
    // startup phase (where the callback isn't guaranteed to exist yet), run a
    // liveness probe before killing. The probe action decides whether to grant
    // a grace cycle or proceed to the kill.
    if (!args.skipLivenessProbe && !startupStillInProgress && run.repoId) {
      await ctx.scheduler.runAfter(
        0,
        internal.taskWorkflow.probeStaleRunLiveness,
        {
          runId: args.runId,
          taskId: args.taskId,
          sandboxId: run.sandboxId,
          repoId: run.repoId,
          streamingAgeMs,
          finishingInProgress,
        },
      );
      return null;
    }

    const errorMessage = startupStillInProgress
      ? "Run killed by watchdog: sandbox startup stalled"
      : finishingInProgress
        ? `Run killed by watchdog: finalization stalled (no heartbeat for ${staleSeconds}s)`
        : `Run killed by watchdog: no heartbeat for ${staleSeconds}s`;
    const exitReason = startupStillInProgress
      ? "watchdog_startup_stalled"
      : finishingInProgress
        ? "watchdog_finalizing_stalled"
        : "watchdog_killed";

    console.log(
      `[watchdog][kill] runId=${args.runId} reason=${exitReason} streamingAgeMs=${streamingAgeMs} thresholdMs=${staleThresholdMs} skipProbe=${args.skipLivenessProbe ?? false} startup=${startupStillInProgress} finishing=${finishingInProgress} activity=${JSON.stringify(streaming?.currentActivity ?? "").slice(0, 200)}`,
    );

    await cleanUpStaleRun(ctx, {
      taskId: args.taskId,
      runId: args.runId,
      sandboxId: run.sandboxId,
      repoId: run.repoId,
      isProjectTask: !!task.projectId,
      errorMessage,
      exitReason,
      activeWorkflowId: task.activeWorkflowId,
      taskStatus: task.status,
    });
    return null;
  },
});

/** Hard-timeout handler that kills a run after the maximum allowed duration (2 hours). */
export const handleStaleRun = internalMutation({
  args: {
    taskId: v.id("agentTasks"),
    runId: v.id("agentRuns"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return null;
    if (task.status !== "in_progress" || !task.activeWorkflowId) return null;

    const runs = await ctx.db
      .query("agentRuns")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    const latestRun = runs.sort(
      (a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0),
    )[0];
    if (latestRun && latestRun._id !== args.runId) return null;

    try {
      await workflow.cancel(ctx, task.activeWorkflowId as WorkflowId);
    } catch {}

    const run = await ctx.db.get(args.runId);

    if (run && (run.status === "queued" || run.status === "running")) {
      await cleanUpStaleRun(ctx, {
        taskId: args.taskId,
        runId: args.runId,
        sandboxId: run.sandboxId,
        repoId: run.repoId,
        isProjectTask: !!task.projectId,
        errorMessage: "Run timed out after 2 hours",
        exitReason: "run_timeout",
        taskStatus: task.status,
      });
    } else {
      const taskStatus =
        run && run.status === "success" ? "business_review" : "todo";
      await ctx.db.patch(args.taskId, {
        status: taskStatus,
        activeWorkflowId: undefined,
        updatedAt: Date.now(),
      });
    }

    const audits = await ctx.db
      .query("audits")
      .withIndex("by_entity", (q) => q.eq("entityId", args.taskId))
      .collect();
    for (const audit of audits) {
      if (audit.status === "running") {
        await ctx.db.patch(audit._id, {
          status: "error",
          error: "Run timed out",
        });
      }
    }

    await snapshotStreamingActivityToLog(
      ctx,
      getTaskRunStreamingEntityId(args.runId),
      args.runId,
    );
    await clearStreamingActivity(ctx, getTaskRunStreamingEntityId(args.runId));
    await clearStreamingActivity(ctx, String(args.taskId));
    await clearStreamingActivity(
      ctx,
      getTaskAuditStreamingEntityId(args.runId),
    );
    await clearStreamingActivity(ctx, `audit-${String(args.taskId)}`);

    if (task.projectId) {
      const project = await ctx.db.get(task.projectId);
      if (project?.activeBuildWorkflowId) {
        try {
          await workflow.sendEvent(ctx, {
            ...buildTaskDoneEvent,
            workflowId: project.activeBuildWorkflowId as WorkflowId,
            value: { taskId: args.taskId, success: false },
          });
        } catch {}
      }
    }

    return null;
  },
});
