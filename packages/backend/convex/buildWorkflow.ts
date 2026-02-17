import { v } from "convex/values";
import { internalMutation, internalQuery, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { workflow } from "./workflowManager";
import { getCurrentUserId } from "./auth";
import { buildTaskDoneEvent } from "./taskWorkflow";

// --- Workflow ---

export const buildProjectWorkflow = workflow.define({
  args: {
    projectId: v.id("projects"),
    convexToken: v.string(),
    githubToken: v.string(),
  },
  handler: async (step, args): Promise<void> => {
    // Step 1: Fetch all "todo" tasks for the project, sorted by taskNumber
    const tasks = await step.runQuery(internal.buildWorkflow.getProjectTasks, {
      projectId: args.projectId,
    });

    if (tasks.length <= 1) {
      // No tasks to execute (index 0 is skipped per existing behavior)
      await step.runMutation(internal.buildWorkflow.completeBuild, {
        projectId: args.projectId,
      });
      return;
    }

    // Step 2: Execute tasks sequentially (skip index 0 — matches current Inngest behavior)
    for (let i = 1; i < tasks.length; i++) {
      const task = tasks[i];

      // Start the task execution workflow
      await step.runMutation(internal.buildWorkflow.startTaskForBuild, {
        taskId: task._id,
        projectId: args.projectId,
        convexToken: args.convexToken,
        githubToken: args.githubToken,
      });

      // Wait for the task workflow to send completion event
      const result = await step.awaitEvent(buildTaskDoneEvent);

      // If task failed, stop the build
      if (!result.success) break;
    }

    // Step 3: Finalize the build
    await step.runMutation(internal.buildWorkflow.completeBuild, {
      projectId: args.projectId,
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
    convexToken: v.string(),
    githubToken: v.string(),
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
        installationId: repo.installationId,
        projectId: args.projectId,
        branchName: project.branchName,
        isFirstTaskOnBranch,
        model: task.model,
        convexToken: args.convexToken,
        githubToken: args.githubToken,
      },
    );

    await ctx.db.patch(args.taskId, {
      activeWorkflowId: String(workflowId),
    });

    return null;
  },
});

export const completeBuild = internalMutation({
  args: { projectId: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.projectId, {
      activeBuildWorkflowId: undefined,
    });
    return null;
  },
});

// --- Public mutations ---

/**
 * Frontend trigger — starts the project build workflow.
 * Called from the "Start cooking" button in ProjectDetailClient.
 */
export const startBuild = mutation({
  args: {
    projectId: v.id("projects"),
    convexToken: v.string(),
    githubToken: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    if (project.activeBuildWorkflowId) {
      throw new Error("Project already has an active build");
    }

    const workflowId = await workflow.start(
      ctx,
      internal.buildWorkflow.buildProjectWorkflow,
      {
        projectId: args.projectId,
        convexToken: args.convexToken,
        githubToken: args.githubToken,
      },
    );

    await ctx.db.patch(args.projectId, {
      activeBuildWorkflowId: String(workflowId),
    });

    return null;
  },
});
