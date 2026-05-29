import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalAction, internalMutation } from "../_generated/server";
import { authMutation, hasRepoAccess } from "../functions";
import { workflow } from "../workflowManager";
import { resolveTaskWorkflowBaseBranchForTask } from "../_taskWorkflow/resolveBaseBranch";

const PREVIEW_ALLOWED_STATUSES = [
  "code_review",
  "business_review",
  "done",
] as const;

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
        `Task must be in code_review, business_review or done status to start sandbox. Current status: ${task.status}`,
      );
    }

    const repo = await ctx.db.get(task.repoId);
    if (!repo) throw new Error("Repository not found");

    const hasAccess = await hasRepoAccess(ctx.db, repo._id, ctx.userId);
    if (!hasAccess) throw new Error("No access to repository");

    const branchName = `eva/task-${args.taskId}`;
    const baseBranch = await resolveTaskWorkflowBaseBranchForTask(
      ctx.db,
      task,
      repo,
    );

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

/**
 * Re-runs startup commands for a task's preview sandbox by kicking off the
 * regular sandbox startup workflow with `forceStartupCommands: true`. Used to
 * recover when startup commands previously failed (the marker file is created
 * regardless of failure, so a normal start would skip them).
 *
 * Auto-starts the sandbox if it isn't running yet — same workflow path either
 * way, just with the force flag set so commands always re-execute.
 */
export const retryStartupCommands = authMutation({
  args: {
    taskId: v.id("agentTasks"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    if (!task.repoId) throw new Error("Task has no associated repository");

    if (
      task.status !== "code_review" &&
      task.status !== "business_review" &&
      task.status !== "done"
    ) {
      throw new Error(
        `Task must be in code_review, business_review or done status to run startup commands. Current status: ${task.status}`,
      );
    }

    if (
      task.reviewTaskSandboxStatus === "starting" ||
      task.reviewTaskSandboxStatus === "stopping"
    ) {
      throw new Error(
        "Sandbox is currently starting or stopping. Wait for it to settle before retrying.",
      );
    }

    const repo = await ctx.db.get(task.repoId);
    if (!repo) throw new Error("Repository not found");

    const hasAccess = await hasRepoAccess(ctx.db, repo._id, ctx.userId);
    if (!hasAccess) throw new Error("No access to repository");

    const branchName = `eva/task-${args.taskId}`;
    const baseBranch = await resolveTaskWorkflowBaseBranchForTask(
      ctx.db,
      task,
      repo,
    );

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
        forceStartupCommands: true,
      },
    );

    return null;
  },
});

/**
 * Re-runs the dev server in an active preview sandbox using the repo App
 * settings (same resolution as sandbox startup). For recovery when preview
 * is stuck loading but the sandbox itself is running.
 */
export const runDevServer = authMutation({
  args: {
    taskId: v.id("agentTasks"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    if (!task.repoId) throw new Error("Task has no associated repository");

    if (task.reviewTaskSandboxStatus !== "active" || !task.sandboxId) {
      throw new Error("Start the sandbox before running the dev server");
    }

    if (
      !PREVIEW_ALLOWED_STATUSES.includes(
        task.status as (typeof PREVIEW_ALLOWED_STATUSES)[number],
      )
    ) {
      throw new Error(
        `Task must be in code_review, business_review or done status. Current status: ${task.status}`,
      );
    }

    const hasAccess = await hasRepoAccess(ctx.db, task.repoId, ctx.userId);
    if (!hasAccess) throw new Error("No access to repository");

    await ctx.scheduler.runAfter(
      0,
      internal.daytona.runDevServerInTaskSandbox,
      {
        taskId: args.taskId,
        sandboxId: task.sandboxId,
        repoId: task.repoId,
      },
    );

    return null;
  },
});

/** Persists resolved dev server settings after a manual dev-server rerun. */
export const patchTaskDevServer = internalMutation({
  args: {
    taskId: v.id("agentTasks"),
    devPort: v.number(),
    devCommand: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, {
      devPort: args.devPort,
      devCommand: args.devCommand,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/**
 * Stops the preview sandbox in Daytona. Keeps `sandboxId` so the reviewer
 * can resume the same paused filesystem (DB state intact) on next start.
 *
 * Marks the task as `"stopping"` synchronously so the UI can show a spinner
 * and disable the Start button until the real Daytona stop (~10s) completes.
 * Without the transient `"stopping"` state, a quick Start click during the
 * stop window would race with `getOrCreateSandbox` and silently spawn an
 * orphan sandbox.
 */
export const stopTaskSandbox = authMutation({
  args: { taskId: v.id("agentTasks") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    if (!task.repoId) throw new Error("Task has no associated repository");

    const hasAccess = await hasRepoAccess(ctx.db, task.repoId, ctx.userId);
    if (!hasAccess) throw new Error("No access to repository");

    if (!task.sandboxId) {
      // Nothing to stop — close immediately.
      await ctx.db.patch(args.taskId, {
        reviewTaskSandboxStatus: "closed",
        updatedAt: Date.now(),
      });
      return null;
    }

    await ctx.scheduler.runAfter(
      0,
      internal._agentTasks.sandbox.finalizeStopTaskSandbox,
      {
        taskId: args.taskId,
        sandboxId: task.sandboxId,
        repoId: task.repoId,
      },
    );

    // Keep sandboxId so we can resume the stopped sandbox later.
    await ctx.db.patch(args.taskId, {
      reviewTaskSandboxStatus: "stopping",
      updatedAt: Date.now(),
    });

    return null;
  },
});

/**
 * Awaits the Daytona stop and finalizes the task sandbox status to `"closed"`.
 * Always flips status, even if Daytona errors — a stuck `"stopping"` state
 * would leave the user unable to Start. Captures any Daytona error so the
 * mutation can record a `stop_failed` event with full detail.
 */
export const finalizeStopTaskSandbox = internalAction({
  args: {
    taskId: v.id("agentTasks"),
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    let stopError: string | undefined;
    try {
      await ctx.runAction(internal.daytona.stopSandbox, {
        sandboxId: args.sandboxId,
        repoId: args.repoId,
      });
    } catch (err) {
      stopError = err instanceof Error ? err.message : String(err);
    }
    await ctx.runMutation(internal._agentTasks.sandbox.markTaskSandboxClosed, {
      taskId: args.taskId,
      error: stopError,
    });
    return null;
  },
});

/**
 * Internal: flips task sandbox status from `"stopping"` to `"closed"` after
 * Daytona stop completes, and logs a `stopped` (success) or `stop_failed`
 * (with error detail) event to the activity timeline.
 */
export const markTaskSandboxClosed = internalMutation({
  args: {
    taskId: v.id("agentTasks"),
    error: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return null;
    // Only flip if still stopping — don't overwrite a fresh start.
    if (task.reviewTaskSandboxStatus !== "stopping") return null;
    await ctx.db.insert("taskSandboxEvents", {
      taskId: args.taskId,
      event: args.error ? "stop_failed" : "stopped",
      errorDetail: args.error,
      createdAt: Date.now(),
    });
    await ctx.db.patch(args.taskId, {
      reviewTaskSandboxStatus: "closed",
      updatedAt: Date.now(),
    });
    return null;
  },
});

/**
 * Marks a task preview sandbox as ready (internal use), and logs a `started`
 * event for fresh sandboxes or `reconnected` for resumed sandboxes.
 */
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

    await ctx.db.insert("taskSandboxEvents", {
      taskId: args.taskId,
      event: args.isNew ? "started" : "reconnected",
      createdAt: Date.now(),
    });

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

/**
 * Records a task sandbox startup failure (internal use) and logs a `failed`
 * event with the error detail so the user can inspect what went wrong.
 */
export const taskSandboxError = internalMutation({
  args: {
    taskId: v.id("agentTasks"),
    error: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return null;

    await ctx.db.insert("taskSandboxEvents", {
      taskId: args.taskId,
      event: "failed",
      errorDetail: args.error,
      createdAt: Date.now(),
    });

    await ctx.db.patch(args.taskId, {
      reviewTaskSandboxStatus: "closed",
      updatedAt: Date.now(),
    });

    return null;
  },
});
