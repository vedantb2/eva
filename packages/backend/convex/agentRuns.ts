import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalMutation } from "./_generated/server";
import {
  runStatusValidator,
  logLevelValidator,
  deploymentStatusValidator,
  agentRunFields,
} from "./validators";
import { createNotification } from "./notifications";
import {
  authQuery,
  authMutation,
  hasTaskAccess,
  recomputeProjectPhase,
} from "./functions";

const agentRunValidator = v.object({
  _id: v.id("agentRuns"),
  _creationTime: v.number(),
  ...agentRunFields,
});

const agentRunSummaryValidator = v.object(agentRunValidator.fields);

function buildRunNotificationMessage(params: {
  success: boolean;
  projectId: Id<"projects"> | undefined;
  resultSummary: string | undefined;
  error: string | undefined;
  prUrl: string | undefined;
}): string {
  const scopeLabel = params.projectId ? "project task" : "quick task";
  if (params.success) {
    if (params.prUrl) {
      return `Run succeeded for this ${scopeLabel}. Pull request: ${params.prUrl}`;
    }
    if (params.resultSummary) {
      return `Run succeeded for this ${scopeLabel}. ${params.resultSummary}`;
    }
    return `Run succeeded for this ${scopeLabel}.`;
  }
  if (params.error) {
    const trimmedError = params.error.trim();
    const clippedError =
      trimmedError.length > 200
        ? `${trimmedError.slice(0, 197)}...`
        : trimmedError;
    return `Run failed for this ${scopeLabel}. ${clippedError}`;
  }
  return `Run failed for this ${scopeLabel}.`;
}
export const get = authQuery({
  args: { id: v.id("agentRuns") },
  returns: v.union(agentRunSummaryValidator, v.null()),
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.id);
    if (!run) {
      return null;
    }
    const task = await ctx.db.get(run.taskId);
    if (!task || !(await hasTaskAccess(ctx.db, task, ctx.userId))) return null;
    return run;
  },
});

export const getWithDetails = authQuery({
  args: { id: v.id("agentRuns") },
  returns: v.union(
    v.object({
      ...agentRunSummaryValidator.fields,
      taskTitle: v.string(),
      taskDescription: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.id);
    if (!run) return null;
    const task = await ctx.db.get(run.taskId);
    if (!task || !(await hasTaskAccess(ctx.db, task, ctx.userId))) return null;
    return {
      ...run,
      taskTitle: task.title,
      taskDescription: task.description,
    };
  },
});

export const getActivityLog = authQuery({
  args: { id: v.id("agentRuns") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.id);
    if (!run) return null;
    const task = await ctx.db.get(run.taskId);
    if (!task || !(await hasTaskAccess(ctx.db, task, ctx.userId))) return null;

    const activityLog =
      (await ctx.db
        .query("agentRunActivityLogs")
        .withIndex("by_run_and_type", (q) =>
          q.eq("runId", args.id).eq("type", "run"),
        )
        .first()) ??
      (await ctx.db
        .query("agentRunActivityLogs")
        .withIndex("by_run_and_type", (q) =>
          q.eq("runId", args.id).eq("type", undefined),
        )
        .first());
    return activityLog?.activityLog ?? null;
  },
});

export const listByTask = authQuery({
  args: { taskId: v.id("agentTasks") },
  returns: v.array(agentRunSummaryValidator),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || !(await hasTaskAccess(ctx.db, task, ctx.userId))) return [];
    const runs = await ctx.db
      .query("agentRuns")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    return runs.sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0));
  },
});

export const listAll = authQuery({
  args: {},
  returns: v.array(
    v.object({
      ...agentRunSummaryValidator.fields,
      taskTitle: v.string(),
    }),
  ),
  handler: async (ctx) => {
    const tasks = await ctx.db.query("agentTasks").collect();
    const accessibleTasks: typeof tasks = [];
    for (const t of tasks) {
      if (await hasTaskAccess(ctx.db, t, ctx.userId)) accessibleTasks.push(t);
    }
    const enrichedRuns = [];
    for (const task of accessibleTasks) {
      const runs = await ctx.db
        .query("agentRuns")
        .withIndex("by_task", (q) => q.eq("taskId", task._id))
        .collect();
      for (const run of runs) {
        enrichedRuns.push({ ...run, taskTitle: task.title });
      }
    }
    return enrichedRuns.sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0));
  },
});

export const updateStatus = authMutation({
  args: {
    id: v.id("agentRuns"),
    status: runStatusValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.id);
    if (!run) throw new Error("Run not found");
    const task = await ctx.db.get(run.taskId);
    if (!task || !(await hasTaskAccess(ctx.db, task, ctx.userId)))
      throw new Error("Run not found");
    if (run.status === "success" || run.status === "error")
      throw new Error("Cannot update completed run");
    await ctx.db.patch(args.id, { status: args.status });
    if (args.status === "running") {
      await ctx.db.patch(task._id, {
        status: "in_progress",
        updatedAt: Date.now(),
      });
      if (task.projectId) {
        await recomputeProjectPhase(ctx.db, task.projectId);
      }
    }
    return null;
  },
});

export const appendLog = authMutation({
  args: {
    id: v.id("agentRuns"),
    level: logLevelValidator,
    message: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.id);
    if (!run) throw new Error("Run not found");
    const task = await ctx.db.get(run.taskId);
    if (!task || !(await hasTaskAccess(ctx.db, task, ctx.userId)))
      throw new Error("Run not found");
    if (run.status === "success" || run.status === "error")
      throw new Error("Cannot append to completed run");
    const newLog = {
      timestamp: Date.now(),
      level: args.level,
      message: args.message,
    };
    await ctx.db.patch(args.id, {
      logs: [...run.logs, newLog],
    });
    return null;
  },
});

export const complete = authMutation({
  args: {
    id: v.id("agentRuns"),
    success: v.boolean(),
    resultSummary: v.optional(v.string()),
    prUrl: v.optional(v.string()),
    error: v.optional(v.string()),
    activityLog: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.id);
    if (!run) throw new Error("Run not found");
    const task = await ctx.db.get(run.taskId);
    if (!task || !(await hasTaskAccess(ctx.db, task, ctx.userId)))
      throw new Error("Run not found");
    if (run.status === "success" || run.status === "error")
      throw new Error("Run already completed");
    const now = Date.now();
    await ctx.db.patch(args.id, {
      status: args.success ? "success" : "error",
      finishedAt: now,
      resultSummary: args.resultSummary,
      prUrl: args.prUrl,
      error: args.error,
    });

    if (args.activityLog !== undefined) {
      const existingActivityLog = await ctx.db
        .query("agentRunActivityLogs")
        .withIndex("by_run_and_type", (q) =>
          q.eq("runId", args.id).eq("type", "run"),
        )
        .first();
      if (existingActivityLog) {
        await ctx.db.patch(existingActivityLog._id, {
          activityLog: args.activityLog,
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("agentRunActivityLogs", {
          runId: args.id,
          activityLog: args.activityLog,
          type: "run",
          updatedAt: now,
        });
      }
    }

    await ctx.db.patch(task._id, {
      status: args.success ? "business_review" : "todo",
      updatedAt: now,
    });
    if (task.projectId) {
      await recomputeProjectPhase(ctx.db, task.projectId);
    }
    const statusText = args.success ? "succeeded" : "failed";
    const notifyUsers = new Set(
      [task.createdBy, task.assignedTo].filter(
        (id): id is Id<"users"> => id !== undefined,
      ),
    );
    for (const userId of notifyUsers) {
      await createNotification(ctx, {
        userId,
        type: "run_completed",
        title: `Run ${statusText} for "${task.title}"`,
        repoId: task.repoId,
        projectId: task.projectId,
        taskId: task._id,
        message: buildRunNotificationMessage({
          success: args.success,
          projectId: task.projectId,
          resultSummary: args.resultSummary,
          error: args.error,
          prUrl: args.prUrl,
        }),
      });
    }
    return null;
  },
});

export const updateDeploymentStatus = internalMutation({
  args: {
    runId: v.id("agentRuns"),
    deploymentStatus: deploymentStatusValidator,
    deploymentUrl: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run) return null;
    await ctx.db.patch(args.runId, {
      deploymentStatus: args.deploymentStatus,
      ...(args.deploymentUrl !== undefined && {
        deploymentUrl: args.deploymentUrl,
      }),
    });
    return null;
  },
});
