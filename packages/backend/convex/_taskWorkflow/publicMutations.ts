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

export const markRunFinalizing = authMutation({
  args: {
    taskId: v.id("agentTasks"),
    runId: v.id("agentRuns"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) {
      throw new Error("Task not found while marking run finalizing");
    }
    const run = await ctx.db.get(args.runId);
    if (!run || run.taskId !== args.taskId) {
      throw new Error("Run not found while marking run finalizing");
    }
    if (run.status !== "running") {
      return null;
    }
    await ctx.db.patch(args.runId, {
      finalizingAt: Date.now(),
    });
    return null;
  },
});

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
    const workflowId = await getActiveWorkflowId(ctx, args.taskId);
    if (!task) {
      throw new Error("Task not found while handling completion");
    }
    if (!workflowId) {
      throw new Error("Active workflow missing while handling completion");
    }

    const runs = await ctx.db
      .query("agentRuns")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    const latestRunningRun = runs
      .filter((run) => run.status === "running")
      .sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0))[0];
    if (!latestRunningRun) {
      throw new Error("No running run found while handling completion");
    }

    if (args.runId) {
      const callbackRun = await ctx.db.get(args.runId);
      if (
        !callbackRun ||
        callbackRun.taskId !== args.taskId ||
        callbackRun.status !== "running" ||
        latestRunningRun._id !== args.runId
      ) {
        throw new Error("Completion callback run did not match active run");
      }
    }

    try {
      await workflow.sendEvent(ctx, {
        ...taskCompleteEvent,
        workflowId,
        value: {
          success: args.success,
          result: args.result,
          error: args.error,
          activityLog: args.activityLog,
        },
      });
    } catch (error) {
      throw new Error(
        `Failed to deliver completion event: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

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
    if (!workflowId) {
      throw new Error(
        "Active workflow missing while handling audit completion",
      );
    }

    const audits = await ctx.db
      .query("audits")
      .withIndex("by_entity", (q) => q.eq("entityId", args.taskId))
      .collect();
    const latestRunningAudit = audits
      .filter((audit) => audit.status === "running")
      .sort((a, b) => b.createdAt - a.createdAt)[0];
    if (!latestRunningAudit) {
      throw new Error("No running audit found while handling completion");
    }

    if (args.runId && latestRunningAudit.runId !== args.runId) {
      throw new Error(
        "Audit completion callback run did not match active audit",
      );
    }

    try {
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
    } catch (error) {
      throw new Error(
        `Failed to deliver audit completion event: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

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
    if (!workflowId) {
      throw new Error(
        "Active workflow missing while handling audit-fix completion",
      );
    }

    try {
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
    } catch (error) {
      throw new Error(
        `Failed to deliver audit-fix completion event: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

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
        finalizingAt: undefined,
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
