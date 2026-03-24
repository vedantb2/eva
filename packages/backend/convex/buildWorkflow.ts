import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import type { WorkflowId } from "@convex-dev/workflow";
import { workflow } from "./workflowManager";
import { authMutation, hasRepoAccess } from "./functions";
import { buildTaskDoneEvent } from "./taskWorkflow";
import { RUN_TIMEOUT_MS } from "./workflowWatchdog";
import { buildProjectBranchName } from "./_projects/helpers";

// --- Workflow ---

export const buildProjectWorkflow = workflow.define({
  args: {
    projectId: v.id("projects"),
    userId: v.id("users"),
    installationId: v.number(),
  },
  handler: async (step, args): Promise<void> => {
    // Step 1: Fetch all "todo" tasks for the project, sorted by taskNumber
    const tasks = await step.runQuery(internal.buildWorkflow.getProjectTasks, {
      projectId: args.projectId,
    });

    if (tasks.length === 0) {
      await step.runMutation(internal.buildWorkflow.completeBuild, {
        projectId: args.projectId,
      });
      return;
    }

    // Step 2: Execute tasks sequentially
    let failedTaskId: string | undefined;
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];

      await step.runMutation(internal.buildWorkflow.startTaskForBuild, {
        taskId: task._id,
        projectId: args.projectId,
        userId: args.userId,
        installationId: args.installationId,
      });

      const result = await step.awaitEvent(buildTaskDoneEvent);

      if (!result.success) {
        failedTaskId = task._id;
        break;
      }
    }

    // Step 3: Finalize the build
    await step.runMutation(internal.buildWorkflow.completeBuild, {
      projectId: args.projectId,
      failedTaskId,
    });
  },
});

// --- Internal functions ---

export const getProjectTasks = internalQuery({
  args: { projectId: v.id("projects") },
  returns: v.array(
    v.object({
      _id: v.id("agentTasks"),
      taskNumber: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("agentTasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    return tasks
      .filter((t) => t.status === "todo")
      .sort((a, b) => (a.taskNumber ?? 0) - (b.taskNumber ?? 0))
      .map((t) => ({ _id: t._id, taskNumber: t.taskNumber }));
  },
});

/**
 * Starts a single task execution within a project build.
 * Combines the logic of agentTasks.startExecution + taskWorkflow.triggerExecution
 * without auth checks (called internally from the build workflow).
 */
export const startTaskForBuild = internalMutation({
  args: {
    taskId: v.id("agentTasks"),
    projectId: v.id("projects"),
    userId: v.id("users"),
    installationId: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    if (!task.repoId) throw new Error("Task has no associated repository");

    const repo = await ctx.db.get(task.repoId);
    if (!repo) throw new Error("Repository not found");

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    // Check for active runs on this task
    const existingRuns = await ctx.db
      .query("agentRuns")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .collect();
    const activeRun = existingRuns.find(
      (r) => r.status === "queued" || r.status === "running",
    );
    if (activeRun) throw new Error("Task already has an active execution");

    // Compute isFirstTaskOnBranch — check if any task in the project had a successful run
    const projectTasks = await ctx.db
      .query("agentTasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    let hasSuccessfulRun = false;
    for (const pt of projectTasks) {
      const runs = await ctx.db
        .query("agentRuns")
        .withIndex("by_task", (q) => q.eq("taskId", pt._id))
        .collect();
      if (runs.some((r) => r.status === "success")) {
        hasSuccessfulRun = true;
        break;
      }
    }
    const isFirstTaskOnBranch = !hasSuccessfulRun;

    // Create the run
    const runId = await ctx.db.insert("agentRuns", {
      taskId: args.taskId,
      status: "queued",
      logs: [],
      startedAt: Date.now(),
    });

    await ctx.db.patch(args.taskId, {
      status: "in_progress",
      updatedAt: Date.now(),
    });

    // Start the task execution workflow
    const workflowId = await workflow.start(
      ctx,
      internal.taskWorkflow.taskExecutionWorkflow,
      {
        runId,
        taskId: args.taskId,
        repoId: task.repoId,
        installationId: args.installationId,
        projectId: args.projectId,
        branchName:
          project.branchName ??
          buildProjectBranchName(args.projectId, project.branchVersion),
        baseBranch: project.baseBranch ?? "main",
        isFirstTaskOnBranch,
        model: task.model ?? repo.defaultModel,
        userId: args.userId,
      },
    );

    await ctx.db.patch(args.taskId, {
      activeWorkflowId: String(workflowId),
    });

    return null;
  },
});

export const completeBuild = internalMutation({
  args: {
    projectId: v.id("projects"),
    failedTaskId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.projectId, {
      activeBuildWorkflowId: undefined,
      lastBuildError: args.failedTaskId
        ? `Build stopped: task ${args.failedTaskId} failed`
        : undefined,
    });
    return null;
  },
});

// --- Public mutations ---

/**
 * Frontend trigger — starts the project build workflow.
 * Called from the "Start cooking" button in ProjectDetailClient.
 */
export const startBuild = authMutation({
  args: {
    projectId: v.id("projects"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project || !(await hasRepoAccess(ctx.db, project.repoId, ctx.userId)))
      throw new Error("Project not found");

    if (project.activeBuildWorkflowId) {
      throw new Error("Project already has an active build");
    }

    const repo = await ctx.db.get(project.repoId);
    if (!repo) throw new Error("Repository not found");

    const workflowId = await workflow.start(
      ctx,
      internal.buildWorkflow.buildProjectWorkflow,
      {
        projectId: args.projectId,
        userId: ctx.userId,
        installationId: repo.installationId,
      },
    );

    await ctx.db.patch(args.projectId, {
      activeBuildWorkflowId: String(workflowId),
      lastBuildError: undefined,
    });

    await ctx.scheduler.runAfter(
      RUN_TIMEOUT_MS,
      internal.workflowWatchdog.handleStaleBuild,
      { projectId: args.projectId, workflowId: String(workflowId) },
    );

    return null;
  },
});

// --- Scheduled Build ---

/**
 * Called by the Convex scheduler at the scheduled time.
 * Kicks off the build workflow if the project is still eligible.
 */
export const executeScheduledBuild = internalMutation({
  args: { projectId: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return null;

    // Clear schedule fields regardless
    await ctx.db.patch(args.projectId, {
      scheduledBuildAt: undefined,
      scheduledBuildFunctionId: undefined,
    });

    // Don't start if already building
    if (project.activeBuildWorkflowId) return null;

    const repo = await ctx.db.get(project.repoId);
    if (!repo) return null;

    const workflowId = await workflow.start(
      ctx,
      internal.buildWorkflow.buildProjectWorkflow,
      {
        projectId: args.projectId,
        userId: project.userId,
        installationId: repo.installationId,
      },
    );

    await ctx.db.patch(args.projectId, {
      activeBuildWorkflowId: String(workflowId),
    });

    await ctx.scheduler.runAfter(
      RUN_TIMEOUT_MS,
      internal.workflowWatchdog.handleStaleBuild,
      { projectId: args.projectId, workflowId: String(workflowId) },
    );

    return null;
  },
});

export const scheduleBuild = authMutation({
  args: {
    projectId: v.id("projects"),
    scheduledAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project || !(await hasRepoAccess(ctx.db, project.repoId, ctx.userId)))
      throw new Error("Project not found");
    if (project.activeBuildWorkflowId)
      throw new Error("Project already has an active build");
    if (project.scheduledBuildFunctionId)
      throw new Error("Project already has a scheduled build");
    if (args.scheduledAt <= Date.now())
      throw new Error("Scheduled time must be in the future");

    const functionId = await ctx.scheduler.runAt(
      args.scheduledAt,
      internal.buildWorkflow.executeScheduledBuild,
      { projectId: args.projectId },
    );
    await ctx.db.patch(args.projectId, {
      scheduledBuildAt: args.scheduledAt,
      scheduledBuildFunctionId: functionId,
    });
    return null;
  },
});

export const cancelScheduledBuild = authMutation({
  args: { projectId: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project || !(await hasRepoAccess(ctx.db, project.repoId, ctx.userId)))
      throw new Error("Project not found");
    if (!project.scheduledBuildFunctionId)
      throw new Error("Project has no scheduled build");

    try {
      await ctx.scheduler.cancel(project.scheduledBuildFunctionId);
    } catch {
      // may have already fired
    }
    await ctx.db.patch(args.projectId, {
      scheduledBuildAt: undefined,
      scheduledBuildFunctionId: undefined,
    });
    return null;
  },
});

export const cancelBuild = authMutation({
  args: { projectId: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project || !(await hasRepoAccess(ctx.db, project.repoId, ctx.userId)))
      throw new Error("Project not found");

    if (!project.activeBuildWorkflowId) {
      throw new Error("No active build to cancel");
    }

    try {
      await workflow.cancel(ctx, project.activeBuildWorkflowId as WorkflowId);
    } catch {}

    const tasks = await ctx.db
      .query("agentTasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    for (const task of tasks) {
      if (task.status !== "in_progress") continue;

      if (task.activeWorkflowId) {
        try {
          await workflow.cancel(ctx, task.activeWorkflowId as WorkflowId);
        } catch {}
      }

      const run = await ctx.db
        .query("agentRuns")
        .withIndex("by_task", (q) => q.eq("taskId", task._id))
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
      }

      await ctx.db.patch(task._id, {
        status: "todo",
        activeWorkflowId: undefined,
        updatedAt: Date.now(),
      });
    }

    await ctx.db.patch(args.projectId, {
      activeBuildWorkflowId: undefined,
      lastBuildError: "Build cancelled by user",
    });

    return null;
  },
});

export const updateScheduledBuild = authMutation({
  args: {
    projectId: v.id("projects"),
    scheduledAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project || !(await hasRepoAccess(ctx.db, project.repoId, ctx.userId)))
      throw new Error("Project not found");
    if (args.scheduledAt <= Date.now())
      throw new Error("Scheduled time must be in the future");

    if (project.scheduledBuildFunctionId) {
      try {
        await ctx.scheduler.cancel(project.scheduledBuildFunctionId);
      } catch {
        // may have already fired
      }
    }

    const functionId = await ctx.scheduler.runAt(
      args.scheduledAt,
      internal.buildWorkflow.executeScheduledBuild,
      { projectId: args.projectId },
    );
    await ctx.db.patch(args.projectId, {
      scheduledBuildAt: args.scheduledAt,
      scheduledBuildFunctionId: functionId,
    });
    return null;
  },
});
