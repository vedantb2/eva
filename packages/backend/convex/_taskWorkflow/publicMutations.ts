import { v } from "convex/values";
import { internal } from "../_generated/api";
import type { WorkflowId } from "@convex-dev/workflow";
import { workflow } from "../workflowManager";
import { authMutation, hasTaskAccess } from "../functions";
import { claudeModelValidator } from "../validators";
import {
  taskCompleteEvent,
  auditCompleteEvent,
  auditFixCompleteEvent,
} from "./events";
import {
  clearStreamingActivity,
  getTaskAuditStreamingEntityId,
  getTaskRunStreamingEntityId,
} from "./helpers";
import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

async function getActiveWorkflowId(
  ctx: MutationCtx,
  taskId: Id<"agentTasks">,
): Promise<WorkflowId | null> {
  const task = await ctx.db.get(taskId);
  if (!task?.activeWorkflowId) return null;
  return task.activeWorkflowId as WorkflowId;
}

export const handleCompletion = authMutation({
  args: {
    taskId: v.id("agentTasks"),
    runId: v.optional(v.id("agentRuns")),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
    rawResultEvent: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || !task.activeWorkflowId) return null;

    const runs = await ctx.db
      .query("agentRuns")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    const latestRunningRun = runs
      .filter((run) => run.status === "running")
      .sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0))[0];
    if (!latestRunningRun) return null;

    if (args.runId) {
      const callbackRun = await ctx.db.get(args.runId);
      if (
        !callbackRun ||
        callbackRun.taskId !== args.taskId ||
        callbackRun.status !== "running" ||
        latestRunningRun._id !== args.runId
      ) {
        return null;
      }
    }

    await workflow.sendEvent(ctx, {
      ...taskCompleteEvent,
      workflowId: task.activeWorkflowId as WorkflowId,
      value: {
        success: args.success,
        result: args.result,
        error: args.error,
        activityLog: args.activityLog,
      },
    });

    if (task.repoId) {
      await ctx.db.insert("logs", {
        entityType: "quickTask",
        entityId: String(args.taskId),
        entityTitle: task.title,
        rawResultEvent: args.rawResultEvent,
        repoId: task.repoId,
        createdAt: Date.now(),
      });
    }

    return null;
  },
});

export const handleAuditCompletion = authMutation({
  args: {
    taskId: v.id("agentTasks"),
    runId: v.optional(v.id("agentRuns")),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
    rawResultEvent: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const workflowId = await getActiveWorkflowId(ctx, args.taskId);
    if (!workflowId) return null;

    const audits = await ctx.db
      .query("audits")
      .withIndex("by_entity", (q) => q.eq("entityId", args.taskId))
      .collect();
    const latestRunningAudit = audits
      .filter((audit) => audit.status === "running")
      .sort((a, b) => b.createdAt - a.createdAt)[0];
    if (!latestRunningAudit) return null;

    if (args.runId && latestRunningAudit.runId !== args.runId) {
      return null;
    }

    await workflow.sendEvent(ctx, {
      ...auditCompleteEvent,
      workflowId,
      value: {
        success: args.success,
        result: args.result,
        error: args.error,
        activityLog: args.activityLog,
      },
    });

    const task = await ctx.db.get(args.taskId);
    if (task?.repoId) {
      await ctx.db.insert("logs", {
        entityType: "taskAudit",
        entityId: String(args.taskId),
        entityTitle: `Audit: ${task.title}`,
        rawResultEvent: args.rawResultEvent,
        repoId: task.repoId,
        createdAt: Date.now(),
      });
    }

    return null;
  },
});

export const handleAuditFixCompletion = authMutation({
  args: {
    taskId: v.id("agentTasks"),
    runId: v.optional(v.id("agentRuns")),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
    rawResultEvent: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const workflowId = await getActiveWorkflowId(ctx, args.taskId);
    if (!workflowId) return null;

    await workflow.sendEvent(ctx, {
      ...auditFixCompleteEvent,
      workflowId,
      value: {
        success: args.success,
        result: args.result,
        error: args.error,
        activityLog: args.activityLog,
      },
    });

    return null;
  },
});

export const cancelExecution = authMutation({
  args: { taskId: v.id("agentTasks") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    if (!(await hasTaskAccess(ctx.db, task, ctx.userId))) {
      throw new Error("Not authorized");
    }

    if (task.activeWorkflowId) {
      try {
        await workflow.cancel(ctx, task.activeWorkflowId as WorkflowId);
      } catch {}
    }

    const run = await ctx.db
      .query("agentRuns")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "queued"),
          q.eq(q.field("status"), "running"),
        ),
      )
      .first();

    if (run) {
      await ctx.db.patch(run._id, {
        status: "error",
        error: "Cancelled by user",
        finishedAt: Date.now(),
      });
      await clearStreamingActivity(ctx, getTaskRunStreamingEntityId(run._id));
      await clearStreamingActivity(ctx, getTaskAuditStreamingEntityId(run._id));
    }

    await clearStreamingActivity(ctx, String(args.taskId));
    await clearStreamingActivity(ctx, `audit-${String(args.taskId)}`);

    await ctx.db.patch(args.taskId, {
      status: "todo",
      activeWorkflowId: undefined,
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const triggerExecution = authMutation({
  args: {
    runId: v.id("agentRuns"),
    taskId: v.id("agentTasks"),
    repoId: v.id("githubRepos"),
    installationId: v.number(),
    projectId: v.optional(v.id("projects")),
    branchName: v.optional(v.string()),
    baseBranch: v.optional(v.string()),
    isFirstTaskOnBranch: v.boolean(),
    model: v.optional(claudeModelValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    const run = await ctx.db.get(args.runId);
    if (!run || run.taskId !== args.taskId) {
      throw new Error("Run not found");
    }

    if (task.activeWorkflowId || run.status !== "queued") {
      return null;
    }

    const workflowId = await workflow.start(
      ctx,
      internal.taskWorkflow.taskExecutionWorkflow,
      {
        runId: args.runId,
        taskId: args.taskId,
        repoId: args.repoId,
        installationId: args.installationId,
        projectId: args.projectId,
        branchName: args.branchName,
        baseBranch: args.baseBranch,
        isFirstTaskOnBranch: args.isFirstTaskOnBranch,
        model: args.model,
        userId: ctx.userId,
      },
    );

    await ctx.db.patch(args.taskId, {
      activeWorkflowId: String(workflowId),
    });

    return null;
  },
});
