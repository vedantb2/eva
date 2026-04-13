import { v } from "convex/values";
import { internal } from "../_generated/api";
import type { WorkflowId } from "@convex-dev/workflow";
import { workflow } from "../workflowManager";
import { authMutation, hasTaskAccess } from "../functions";
import { aiModelValidator } from "../validators";
import { taskCompleteEvent, auditCompleteEvent } from "./events";
import {
  clearStreamingActivity,
  getTaskAuditStreamingEntityId,
  getTaskRunStreamingEntityId,
} from "./helpers";
import type { MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

/** Retrieves the active workflow ID for a task, or null if none exists. */
async function getActiveWorkflowId(
  ctx: MutationCtx,
  taskId: Id<"agentTasks">,
): Promise<WorkflowId | null> {
  const task = await ctx.db.get(taskId);
  if (!task?.activeWorkflowId) return null;
  return task.activeWorkflowId as WorkflowId;
}

/** Returns the most recently started running task run for a task, or null if none remain. */
async function getLatestRunningTaskRun(
  ctx: MutationCtx,
  taskId: Id<"agentTasks">,
): Promise<Doc<"agentRuns"> | null> {
  const runs = await ctx.db
    .query("agentRuns")
    .withIndex("by_task", (q) => q.eq("taskId", taskId))
    .collect();
  return (
    runs
      .filter((run) => run.status === "running")
      .sort((a, b) => (b.startedAt ?? 0) - (a.startedAt ?? 0))[0] ?? null
  );
}

/** Returns the most recently created running audit for a task, or null if none remain. */
async function getLatestRunningAudit(
  ctx: MutationCtx,
  taskId: Id<"agentTasks">,
): Promise<Doc<"audits"> | null> {
  const audits = await ctx.db
    .query("audits")
    .withIndex("by_entity", (q) => q.eq("entityId", taskId))
    .collect();
  return (
    audits
      .filter((audit) => audit.status === "running")
      .sort((a, b) => b.createdAt - a.createdAt)[0] ?? null
  );
}

/** Logs and ignores a completion callback that belongs to a run which is no longer active. */
function ignoreStaleCompletionCallback(reason: string): null {
  console.warn(`[taskWorkflow] Ignoring stale completion callback: ${reason}`);
  return null;
}

/** Receives the task completion callback, validates it, marks the run as finalizing, and forwards the event to the workflow. */
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
    if (!task) {
      return ignoreStaleCompletionCallback(
        `task ${String(args.taskId)} no longer exists`,
      );
    }
    if (!args.runId) {
      return ignoreStaleCompletionCallback(
        `task ${String(args.taskId)} completion arrived without runId`,
      );
    }
    const workflowId = await getActiveWorkflowId(ctx, args.taskId);
    if (!workflowId) {
      return ignoreStaleCompletionCallback(
        `task ${String(args.taskId)} has no active workflow`,
      );
    }
    const callbackRun = await ctx.db.get(args.runId);
    if (!callbackRun || callbackRun.taskId !== args.taskId) {
      return ignoreStaleCompletionCallback(
        `run ${String(args.runId)} is missing or belongs to another task`,
      );
    }
    if (callbackRun.status !== "running") {
      return ignoreStaleCompletionCallback(
        `run ${String(args.runId)} is already ${callbackRun.status}`,
      );
    }
    const latestRunningRun = await getLatestRunningTaskRun(ctx, args.taskId);
    if (!latestRunningRun) {
      return ignoreStaleCompletionCallback(
        `task ${String(args.taskId)} no longer has a running run`,
      );
    }
    if (latestRunningRun._id !== args.runId) {
      return ignoreStaleCompletionCallback(
        `run ${String(args.runId)} lost the race to active run ${String(latestRunningRun._id)}`,
      );
    }

    // Mark run as finalizing before forwarding the completion event
    await ctx.db.patch(latestRunningRun._id, {
      finalizingAt: Date.now(),
    });

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

/** Receives the audit completion callback and forwards the event to the workflow. */
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
    if (!args.runId) {
      return ignoreStaleCompletionCallback(
        `audit completion for task ${String(args.taskId)} arrived without runId`,
      );
    }
    const workflowId = await getActiveWorkflowId(ctx, args.taskId);
    if (!workflowId) {
      return ignoreStaleCompletionCallback(
        `task ${String(args.taskId)} has no active workflow for audit completion`,
      );
    }
    const latestRunningAudit = await getLatestRunningAudit(ctx, args.taskId);
    if (!latestRunningAudit) {
      return ignoreStaleCompletionCallback(
        `task ${String(args.taskId)} no longer has a running audit`,
      );
    }
    if (latestRunningAudit.runId !== args.runId) {
      return ignoreStaleCompletionCallback(
        `audit completion run ${String(args.runId)} does not match active audit run ${String(latestRunningAudit.runId)}`,
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

/** Receives the audit fix completion callback and updates the audit fix status. */
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
    const audit = await ctx.db
      .query("audits")
      .withIndex("by_entity", (q) => q.eq("entityId", args.taskId))
      .order("desc")
      .first();

    if (!audit || audit.fixStatus !== "fixing") return null;

    const fixStatus = args.success ? "fix_completed" : "fix_error";
    await ctx.db.patch(audit._id, {
      fixStatus,
      fixCompletedAt: Date.now(),
    });

    if (args.runId && args.activityLog) {
      const runId = args.runId;
      const existing = await ctx.db
        .query("agentRunActivityLogs")
        .withIndex("by_run_and_type", (q) =>
          q.eq("runId", runId).eq("type", "fix"),
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          activityLog: args.activityLog,
          updatedAt: Date.now(),
        });
      } else {
        await ctx.db.insert("agentRunActivityLogs", {
          runId: args.runId,
          type: "fix",
          activityLog: args.activityLog,
          updatedAt: Date.now(),
        });
      }
    }

    if (args.runId) {
      await clearStreamingActivity(
        ctx,
        getTaskAuditStreamingEntityId(args.runId),
      );
    }

    return null;
  },
});

/** Cancels the active workflow and run for a task, resetting it to todo status. */
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

/** Starts a new task execution workflow for a queued run. */
export const triggerExecution = authMutation({
  args: {
    runId: v.id("agentRuns"),
    taskId: v.id("agentTasks"),
    repoId: v.id("githubRepos"),
    projectId: v.optional(v.id("projects")),
    branchName: v.optional(v.string()),
    baseBranch: v.optional(v.string()),
    isFirstTaskOnBranch: v.boolean(),
    model: v.optional(aiModelValidator),
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

    const repo = await ctx.db.get(args.repoId);
    if (!repo) throw new Error("Repository not found");

    const workflowId = await workflow.start(
      ctx,
      internal.taskWorkflow.taskExecutionWorkflow,
      {
        runId: args.runId,
        taskId: args.taskId,
        repoId: args.repoId,
        installationId: repo.installationId,
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
