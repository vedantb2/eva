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
} from "./helpers";

function isSandboxStartupActivity(
  currentActivity: string | undefined,
): boolean {
  if (!currentActivity) {
    return true;
  }
  return currentActivity.includes('"Starting sandbox..."');
}

function isFinalizingActivity(currentActivity: string | undefined): boolean {
  if (!currentActivity) {
    return false;
  }
  return currentActivity.includes('"Finalizing response..."');
}
export const checkStaleRuns = internalMutation({
  args: {
    runId: v.id("agentRuns"),
    taskId: v.id("agentTasks"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run || run.status !== "running") return null;

    const task = await ctx.db.get(args.taskId);
    if (!task) return null;

    if (!task.activeWorkflowId) {
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
    const finishingInProgress = isFinalizingActivity(
      streaming?.currentActivity,
    );
    const lastActivity = streaming?.lastUpdatedAt ?? run.startedAt ?? 0;
    const staleThresholdMs = startupStillInProgress
      ? STALE_NO_SANDBOX_THRESHOLD_MS
      : finishingInProgress
        ? STALE_FINISHING_THRESHOLD_MS
        : STALE_THRESHOLD_MS;
    const staleSeconds = Math.round(staleThresholdMs / 1000);
    const isStale = Date.now() - lastActivity > staleThresholdMs;

    if (!isStale) {
      await ctx.scheduler.runAfter(
        STALE_RECHECK_MS,
        internal.taskWorkflow.checkStaleRuns,
        { runId: args.runId, taskId: args.taskId },
      );
      return null;
    }

    await cleanUpStaleRun(ctx, {
      taskId: args.taskId,
      runId: args.runId,
      sandboxId: run.sandboxId,
      repoId: run.repoId,
      isProjectTask: !!task.projectId,
      errorMessage: startupStillInProgress
        ? "Run killed by watchdog: sandbox startup stalled"
        : finishingInProgress
          ? `Run killed by watchdog: finalization stalled (no heartbeat for ${staleSeconds}s)`
          : `Run killed by watchdog: no heartbeat for ${staleSeconds}s`,
      exitReason: startupStillInProgress
        ? "watchdog_startup_stalled"
        : finishingInProgress
          ? "watchdog_finalizing_stalled"
          : "watchdog_killed",
      activeWorkflowId: task.activeWorkflowId,
      taskStatus: task.status,
    });
    return null;
  },
});

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
