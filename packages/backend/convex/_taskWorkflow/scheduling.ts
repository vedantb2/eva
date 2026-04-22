import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { workflow } from "../workflowManager";
import { hasActiveRun, isFirstTaskOnBranch } from "../functions";
import { isDaytonaNetworkIssue, buildQuickTaskRetryDelayMs } from "./recovery";
import { buildProjectBranchName } from "../_projects/helpers";

/** Schedules an automatic retry for a failed quick task if the failure looks transient. */
export const maybeScheduleQuickTaskRetry = internalMutation({
  args: {
    taskId: v.id("agentTasks"),
    runId: v.id("agentRuns"),
    error: v.optional(v.string()),
    delayMs: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || task.projectId) return null;

    const run = await ctx.db.get(args.runId);
    if (!run || run.taskId !== args.taskId || run.status !== "error")
      return null;
    if (run.exitReason === "auto_retry_scheduled") return null;

    const errorMessage = args.error ?? run.error ?? "";
    const retryableFailure =
      errorMessage.length > 0 && isDaytonaNetworkIssue(errorMessage);
    if (!retryableFailure) return null;

    if (task.scheduledFunctionId) return null;

    const runs = await ctx.db
      .query("agentRuns")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    const sortedRuns = runs.sort(
      (a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0),
    );

    const latestRun = sortedRuns[0];
    if (!latestRun || latestRun._id !== args.runId) return null;

    const previousRun = sortedRuns[1];
    const previousWasRetrySchedule =
      previousRun !== undefined &&
      previousRun.exitReason === "auto_retry_scheduled";
    if (previousWasRetrySchedule) return null;

    const hasOtherActiveRun = sortedRuns.some(
      (candidate) =>
        candidate._id !== args.runId &&
        (candidate.status === "queued" || candidate.status === "running"),
    );
    if (hasOtherActiveRun) return null;

    const delayMs = args.delayMs ?? buildQuickTaskRetryDelayMs();
    const functionId = await ctx.scheduler.runAfter(
      delayMs,
      internal.taskWorkflow.executeScheduledTask,
      { taskId: args.taskId },
    );

    const scheduledAt = Date.now() + delayMs;
    await ctx.db.patch(args.taskId, {
      scheduledAt,
      scheduledFunctionId: functionId,
      updatedAt: Date.now(),
    });

    const existingError = run.error ?? "Run failed";
    await ctx.db.patch(args.runId, {
      exitReason: "auto_retry_scheduled",
      error: `${existingError}\n\nAuto-retry scheduled in ${Math.round(delayMs / 1000)}s`,
    });

    return null;
  },
});

/** Executes a previously scheduled task retry by creating a new run and starting the workflow. */
export const executeScheduledTask = internalMutation({
  args: { taskId: v.id("agentTasks") },
  returns: v.union(v.id("agentRuns"), v.null()),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return null;

    const clearSchedule: {
      scheduledAt: undefined;
      scheduledFunctionId: undefined;
    } = {
      scheduledAt: undefined,
      scheduledFunctionId: undefined,
    };

    if (task.status !== "todo" || !task.repoId || !task.createdBy) {
      await ctx.db.patch(args.taskId, clearSchedule);
      return null;
    }

    if (await hasActiveRun(ctx.db, args.taskId)) {
      await ctx.db.patch(args.taskId, clearSchedule);
      return null;
    }

    const repo = await ctx.db.get(task.repoId);
    if (!repo) {
      await ctx.db.patch(args.taskId, clearSchedule);
      return null;
    }

    const firstOnBranch = await isFirstTaskOnBranch(
      ctx.db,
      args.taskId,
      task.projectId,
    );

    const runId = await ctx.db.insert("agentRuns", {
      taskId: args.taskId,
      status: "queued",
      logs: [],
      startedAt: Date.now(),
    });

    const now = Date.now();
    await ctx.db.patch(args.taskId, {
      ...clearSchedule,
      status: "in_progress",
      updatedAt: now,
    });

    let branchName: string | undefined;
    if (task.projectId) {
      const project = await ctx.db.get(task.projectId);
      branchName = project
        ? (project.branchName ??
          buildProjectBranchName(task.projectId, project.branchVersion))
        : buildProjectBranchName(task.projectId);
    }

    const workflowId = await workflow.start(
      ctx,
      internal.taskWorkflow.taskExecutionWorkflow,
      {
        runId,
        taskId: args.taskId,
        repoId: task.repoId,
        installationId: repo.installationId,
        projectId: task.projectId,
        branchName,
        baseBranch: task.baseBranch,
        isFirstTaskOnBranch: firstOnBranch,
        model: task.model,
        userId: task.createdBy,
      },
    );

    await ctx.db.patch(args.taskId, {
      activeWorkflowId: String(workflowId),
    });

    return runId;
  },
});

/** Clears the active workflow ID from a task if no runs are still queued or running. */
export const clearActiveWorkflow = internalMutation({
  args: { taskId: v.id("agentTasks") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return null;

    const activeRun = await ctx.db
      .query("agentRuns")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "queued"),
          q.eq(q.field("status"), "running"),
        ),
      )
      .first();

    if (!activeRun) {
      await ctx.db.patch(args.taskId, { activeWorkflowId: undefined });
    }

    return null;
  },
});
