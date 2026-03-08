import { v } from "convex/values";
import { internal } from "../_generated/api";
import { claudeModelValidator } from "../validators";
import {
  authMutation,
  hasTaskAccess,
  hasActiveRun,
  isFirstTaskOnBranch,
} from "../functions";
import { workflow } from "../workflowManager";

export const startExecution = authMutation({
  args: { id: v.id("agentTasks") },
  returns: v.object({
    runId: v.id("agentRuns"),
    taskId: v.id("agentTasks"),
    repoId: v.id("githubRepos"),
    installationId: v.number(),
    projectId: v.optional(v.id("projects")),
    branchName: v.optional(v.string()),
    baseBranch: v.optional(v.string()),
    isFirstTaskOnBranch: v.boolean(),
    model: v.optional(claudeModelValidator),
  }),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task || !(await hasTaskAccess(ctx.db, task, ctx.userId)))
      throw new Error("Task not found");
    if (task.status === "draft") {
      throw new Error("Cannot execute a draft task");
    }
    if (!task.repoId) {
      throw new Error("Task has no associated repository");
    }
    const repo = await ctx.db.get(task.repoId);
    if (!repo) {
      throw new Error("Repository not found");
    }
    if (task.scheduledFunctionId) {
      try {
        await ctx.scheduler.cancel(task.scheduledFunctionId);
      } catch {
        // may have already fired
      }
      await ctx.db.patch(args.id, {
        scheduledAt: undefined,
        scheduledFunctionId: undefined,
      });
    }

    if (await hasActiveRun(ctx.db, args.id)) {
      throw new Error("Task already has an active execution");
    }

    if (task.projectId) {
      const project = await ctx.db.get(task.projectId);
      if (!project) {
        throw new Error("Project not found");
      }

      const projectTasks = await ctx.db
        .query("agentTasks")
        .withIndex("by_project", (q) => q.eq("projectId", task.projectId))
        .collect();

      for (const pt of projectTasks) {
        if (pt._id === args.id) continue;
        if (await hasActiveRun(ctx.db, pt._id)) {
          throw new Error("Another task in this project is already running");
        }
      }
    }

    const firstOnBranch = await isFirstTaskOnBranch(
      ctx.db,
      args.id,
      task.projectId,
    );

    const runId = await ctx.db.insert("agentRuns", {
      taskId: args.id,
      status: "queued",
      logs: [],
      startedAt: Date.now(),
    });
    await ctx.db.patch(args.id, {
      status: "in_progress",
      updatedAt: Date.now(),
    });
    let workflowIdString = "";
    try {
      const workflowId = await workflow.start(
        ctx,
        internal.taskWorkflow.taskExecutionWorkflow,
        {
          runId,
          taskId: args.id,
          repoId: task.repoId,
          installationId: repo.installationId,
          projectId: task.projectId,
          branchName: task.projectId
            ? `eva/project-${task.projectId}`
            : undefined,
          baseBranch: task.baseBranch,
          isFirstTaskOnBranch: firstOnBranch,
          model: task.model ?? repo.defaultModel,
          userId: ctx.userId,
        },
      );
      workflowIdString = String(workflowId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to start workflow";
      await ctx.db.patch(runId, {
        status: "error",
        error: message,
        finishedAt: Date.now(),
        exitReason: "workflow_start_failed",
      });
      await ctx.db.patch(args.id, {
        status: "todo",
        activeWorkflowId: undefined,
        updatedAt: Date.now(),
      });
      throw error;
    }

    await ctx.db.patch(args.id, {
      activeWorkflowId: workflowIdString,
    });

    return {
      runId,
      taskId: args.id,
      repoId: task.repoId,
      installationId: repo.installationId,
      projectId: task.projectId,
      branchName: task.projectId ? `eva/project-${task.projectId}` : undefined,
      baseBranch: task.baseBranch,
      isFirstTaskOnBranch: firstOnBranch,
      model: task.model ?? repo.defaultModel,
    };
  },
});

export const scheduleExecution = authMutation({
  args: {
    id: v.id("agentTasks"),
    scheduledAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task || !(await hasTaskAccess(ctx.db, task, ctx.userId)))
      throw new Error("Task not found");
    if (task.status !== "todo") {
      throw new Error("Only todo tasks can be scheduled");
    }
    const existingRuns = await ctx.db
      .query("agentRuns")
      .withIndex("by_task", (q) => q.eq("taskId", args.id))
      .collect();
    if (
      existingRuns.some((r) => r.status === "queued" || r.status === "running")
    ) {
      throw new Error("Task already has an active execution");
    }
    if (args.scheduledAt <= Date.now()) {
      throw new Error("Scheduled time must be in the future");
    }

    const functionId = await ctx.scheduler.runAt(
      args.scheduledAt,
      internal.taskWorkflow.executeScheduledTask,
      { taskId: args.id },
    );
    await ctx.db.patch(args.id, {
      scheduledAt: args.scheduledAt,
      scheduledFunctionId: functionId,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const cancelScheduledExecution = authMutation({
  args: { id: v.id("agentTasks") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task || !(await hasTaskAccess(ctx.db, task, ctx.userId)))
      throw new Error("Task not found");
    if (!task.scheduledFunctionId) {
      throw new Error("Task is not scheduled");
    }

    try {
      await ctx.scheduler.cancel(task.scheduledFunctionId);
    } catch {
      // may have already fired
    }
    await ctx.db.patch(args.id, {
      scheduledAt: undefined,
      scheduledFunctionId: undefined,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const updateScheduledExecution = authMutation({
  args: {
    id: v.id("agentTasks"),
    scheduledAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task || !(await hasTaskAccess(ctx.db, task, ctx.userId)))
      throw new Error("Task not found");
    if (args.scheduledAt <= Date.now()) {
      throw new Error("Scheduled time must be in the future");
    }

    if (task.scheduledFunctionId) {
      try {
        await ctx.scheduler.cancel(task.scheduledFunctionId);
      } catch {
        // may have already fired
      }
    }

    const functionId = await ctx.scheduler.runAt(
      args.scheduledAt,
      internal.taskWorkflow.executeScheduledTask,
      { taskId: args.id },
    );
    await ctx.db.patch(args.id, {
      scheduledAt: args.scheduledAt,
      scheduledFunctionId: functionId,
      updatedAt: Date.now(),
    });
    return null;
  },
});
