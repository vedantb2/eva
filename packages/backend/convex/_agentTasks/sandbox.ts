import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalMutation } from "../_generated/server";
import { authMutation, hasRepoAccess } from "../functions";
import { workflow } from "../workflowManager";

const PREVIEW_ALLOWED_STATUSES = ["code_review", "business_review"] as const;

/** Starts a preview sandbox for a task, checking out the task branch and running startup commands. */
export const startTaskSandbox = authMutation({
  args: {
    taskId: v.id("agentTasks"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    if (!task.repoId) throw new Error("Task has no associated repository");

    // Validate task status
    if (
      !PREVIEW_ALLOWED_STATUSES.includes(
        task.status as (typeof PREVIEW_ALLOWED_STATUSES)[number],
      )
    ) {
      throw new Error(
        `Task must be in code_review or business_review status to start sandbox. Current status: ${task.status}`,
      );
    }

    const repo = await ctx.db.get(task.repoId);
    if (!repo) throw new Error("Repository not found");

    const hasAccess = await hasRepoAccess(ctx.db, repo._id, ctx.userId);
    if (!hasAccess) throw new Error("No access to repository");

    const branchName = `eva/task-${args.taskId}`;
    const baseBranch = task.baseBranch ?? repo.defaultBaseBranch ?? "main";

    await ctx.db.patch(args.taskId, {
      reviewTaskSandboxStatus: "starting",
      updatedAt: Date.now(),
    });

    await workflow.start(
      ctx,
      internal.taskSandboxWorkflow.taskPreviewSandboxStartupWorkflow,
      {
        taskId: args.taskId,
        existingSandboxId: task.sandboxId,
        installationId: repo.installationId,
        repoOwner: repo.owner,
        repoName: repo.name,
        branchName,
        baseBranch,
        repoId: task.repoId,
      },
    );

    return null;
  },
});

/** Stops the preview sandbox in Daytona. Keeps `sandboxId` so the reviewer
 * can resume the same paused filesystem (DB state intact) on next start. */
export const stopTaskSandbox = authMutation({
  args: { taskId: v.id("agentTasks") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    if (!task.repoId) throw new Error("Task has no associated repository");

    const hasAccess = await hasRepoAccess(ctx.db, task.repoId, ctx.userId);
    if (!hasAccess) throw new Error("No access to repository");

    if (task.sandboxId) {
      await ctx.scheduler.runAfter(0, internal.daytona.stopSandbox, {
        sandboxId: task.sandboxId,
        repoId: task.repoId,
      });
    }

    // Keep sandboxId so we can resume the stopped sandbox later.
    await ctx.db.patch(args.taskId, {
      reviewTaskSandboxStatus: "closed",
      updatedAt: Date.now(),
    });

    return null;
  },
});

/** Marks a task preview sandbox as ready (internal use). */
export const taskSandboxReady = internalMutation({
  args: {
    taskId: v.id("agentTasks"),
    sandboxId: v.string(),
    isNew: v.boolean(),
    devPort: v.optional(v.number()),
    devCommand: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return null;

    await ctx.db.patch(args.taskId, {
      sandboxId: args.sandboxId,
      reviewTaskSandboxStatus: "active",
      updatedAt: Date.now(),
      devPort: args.devPort,
      devCommand: args.devCommand,
    });

    return null;
  },
});

/** Records a task sandbox startup failure (internal use). */
export const taskSandboxError = internalMutation({
  args: {
    taskId: v.id("agentTasks"),
    error: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return null;

    await ctx.db.patch(args.taskId, {
      reviewTaskSandboxStatus: "closed",
      updatedAt: Date.now(),
    });

    return null;
  },
});
