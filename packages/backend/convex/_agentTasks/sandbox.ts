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

function assertPreviewSandboxAllowed(task: {
  status: string;
  sandboxId?: string;
}): void {
  if (task.sandboxId) {
    return;
  }
  if (
    !PREVIEW_ALLOWED_STATUSES.includes(
      task.status as (typeof PREVIEW_ALLOWED_STATUSES)[number],
    )
  ) {
    throw new Error(
      `Task must be in code_review, business_review or done status to start sandbox. Current status: ${task.status}`,
    );
  }
}

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

    assertPreviewSandboxAllowed(task);

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
    // Seed startup streaming immediately so the UI shows a real step instead of
    // the random "Eva is inferring…" spinner while the workflow schedules.
    const startupEntityId = `task-sandbox-startup-${args.taskId}`;
    const startupActivity = JSON.stringify([
      { type: "tool", label: "Starting sandbox...", status: "active" },
    ]);
    const existingStreaming = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", startupEntityId))
      .first();
    if (existingStreaming) {
      await ctx.db.patch(existingStreaming._id, {
        currentActivity: startupActivity,
        currentContent: "",
        lastUpdatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("streamingActivity", {
        entityId: startupEntityId,
        currentActivity: startupActivity,
        currentContent: "",
        lastUpdatedAt: Date.now(),
      });
    }
    const looksLikeDaytonaUuid =
      typeof task.sandboxId === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        task.sandboxId,
      );
    const vercelSandboxId =
      task.vercelSandboxId ??
      (task.sandboxId && !looksLikeDaytonaUuid ? task.sandboxId : undefined);
    console.log(
      `[tasks] startTaskSandbox taskId=${args.taskId} existingSandboxId=${task.sandboxId ?? "none"} vercelSandboxId=${vercelSandboxId ?? "none"}`,
    );

    // Vercel: schedule start action directly (skip ~6s workflow scheduling).
    if (vercelSandboxId) {
      await ctx.scheduler.runAfter(
        0,
        internal.daytona.startTaskPreviewSandbox,
        {
          taskId: args.taskId,
          existingSandboxId: task.sandboxId,
          vercelSandboxId,
          installationId: repo.installationId,
          repoOwner: repo.owner,
          repoName: repo.name,
          branchName,
          baseBranch,
          repoId: task.repoId,
        },
      );
    } else {
      await workflow.start(
        ctx,
        internal.taskSandboxWorkflow.taskPreviewSandboxStartupWorkflow,
        {
          taskId: args.taskId,
          existingSandboxId: task.sandboxId,
          vercelSandboxId: task.vercelSandboxId,
          installationId: repo.installationId,
          repoOwner: repo.owner,
          repoName: repo.name,
          branchName,
          baseBranch,
          repoId: task.repoId,
        },
      );
    }

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

    assertPreviewSandboxAllowed(task);

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
        vercelSandboxId: task.vercelSandboxId,
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

/**
 * Re-launches the repo's configured background commands (long-running daemons
 * like `npx convex dev`) in an active preview sandbox. Background commands
 * already run automatically on every sandbox start/resume; this is for
 * respawning a daemon that died while the sandbox kept running.
 */
export const runBackgroundCommands = authMutation({
  args: {
    taskId: v.id("agentTasks"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    if (!task.repoId) throw new Error("Task has no associated repository");

    if (task.reviewTaskSandboxStatus !== "active" || !task.sandboxId) {
      throw new Error("Start the sandbox before running background commands");
    }

    const hasAccess = await hasRepoAccess(ctx.db, task.repoId, ctx.userId);
    if (!hasAccess) throw new Error("No access to repository");

    await ctx.scheduler.runAfter(0, internal.daytona.runBackgroundCommands, {
      sandboxId: task.sandboxId,
      repoId: task.repoId,
    });

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

    // Clear leftover start steps so stop does not re-show startup activity.
    const startupEntityId = `task-sandbox-startup-${args.taskId}`;
    const startupStreaming = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", startupEntityId))
      .first();
    if (startupStreaming) await ctx.db.delete(startupStreaming._id);

    // Keep sandboxId so we can resume the stopped sandbox later.
    await ctx.db.patch(args.taskId, {
      reviewTaskSandboxStatus: "stopping",
      updatedAt: Date.now(),
    });

    return null;
  },
});

/**
 * Awaits provider stop and finalizes task sandbox status. Only marks `"closed"`
 * after a successful stop — on failure reverts to `"active"` so the UI matches
 * a still-running Vercel VM.
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
 * Internal: after stop settles, either close (success) or revert to active
 * (failure) so Eva never shows off while Vercel is still running.
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
    if (args.error) {
      await ctx.db.insert("taskSandboxEvents", {
        taskId: args.taskId,
        event: "stop_failed",
        errorDetail: args.error,
        createdAt: Date.now(),
      });
      await ctx.db.insert("messages", {
        parentId: args.taskId,
        role: "assistant",
        content: "Failed to stop sandbox",
        timestamp: Date.now(),
        isSystemAlert: true,
        errorDetail: args.error,
      });
      await ctx.db.patch(args.taskId, {
        reviewTaskSandboxStatus: "active",
        updatedAt: Date.now(),
      });
      return null;
    }
    await ctx.db.insert("taskSandboxEvents", {
      taskId: args.taskId,
      event: "stopped",
      createdAt: Date.now(),
    });
    await ctx.db.insert("messages", {
      parentId: args.taskId,
      role: "assistant",
      content: "Sandbox stopped",
      timestamp: Date.now(),
      isSystemAlert: true,
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
    vercelSandboxId: v.optional(v.string()),
    isNew: v.boolean(),
    devPort: v.optional(v.number()),
    devCommand: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return null;

    if (
      task.reviewTaskSandboxStatus === "stopping" ||
      task.reviewTaskSandboxStatus === "closed"
    ) {
      console.log(
        `[tasks] taskSandboxReady ignored taskId=${args.taskId} status=${task.reviewTaskSandboxStatus} sandboxId=${args.sandboxId}`,
      );
      return null;
    }

    // Early-ready (VM up) + final-ready (after services) both call this. Only
    // emit the system alert once; still patch latest sandbox/dev metadata.
    const alreadyActive =
      task.reviewTaskSandboxStatus === "active" &&
      task.sandboxId === args.sandboxId;
    if (!alreadyActive) {
      const content = args.isNew ? "Sandbox started" : "Sandbox reconnected";
      await ctx.db.insert("taskSandboxEvents", {
        taskId: args.taskId,
        event: args.isNew ? "started" : "reconnected",
        createdAt: Date.now(),
      });
      await ctx.db.insert("messages", {
        parentId: args.taskId,
        role: "assistant",
        content,
        timestamp: Date.now(),
        isSystemAlert: true,
      });
    }

    await ctx.db.patch(args.taskId, {
      sandboxId: args.sandboxId,
      ...(args.vercelSandboxId !== undefined
        ? { vercelSandboxId: args.vercelSandboxId }
        : {}),
      reviewTaskSandboxStatus: "active",
      updatedAt: Date.now(),
      ...(args.devPort !== undefined ? { devPort: args.devPort } : {}),
      ...(args.devCommand !== undefined ? { devCommand: args.devCommand } : {}),
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
    await ctx.db.insert("messages", {
      parentId: args.taskId,
      role: "assistant",
      content: "Failed to start sandbox",
      timestamp: Date.now(),
      isSystemAlert: true,
      errorDetail: args.error,
    });

    await ctx.db.patch(args.taskId, {
      reviewTaskSandboxStatus: "closed",
      updatedAt: Date.now(),
    });

    return null;
  },
});
