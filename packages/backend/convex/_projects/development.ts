import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { authMutation, recomputeProjectPhase } from "../functions";
import {
  parseSpec,
  getProjectGeneratedSpec,
  setProjectConversation,
  buildProjectBranchName,
} from "./helpers";
import { FALLBACK_GIT_BASE_BRANCH } from "@conductor/shared";

/** Converts a finalized project spec into tasks with dependencies and sets the project to in_progress. */
export const startDevelopment = authMutation({
  args: {
    projectId: v.id("projects"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    if (project.phase !== "finalized") {
      throw new Error("Project must be finalized before starting development");
    }
    const generatedSpec = await getProjectGeneratedSpec(ctx.db, args.projectId);
    if (!generatedSpec) {
      throw new Error("Project has no generated spec");
    }
    const spec = parseSpec(generatedSpec);
    const branchName = buildProjectBranchName(args.projectId);
    const projectBaseBranch =
      project.baseBranch ??
      (await ctx.db.get(project.repoId))?.defaultBaseBranch ??
      FALLBACK_GIT_BASE_BRANCH;
    const taskIdMap = new Map<number, Id<"agentTasks">>();
    const now = Date.now();
    for (let i = 0; i < spec.tasks.length; i++) {
      const task = spec.tasks[i];
      const taskNumber = i + 1;
      const taskId = await ctx.db.insert("agentTasks", {
        title: task.title,
        description: task.description,
        repoId: project.repoId,
        projectId: args.projectId,
        taskNumber,
        status: "todo",
        createdAt: now,
        updatedAt: now,
        createdBy: ctx.userId,
        baseBranch: projectBaseBranch,
      });
      taskIdMap.set(taskNumber, taskId);
    }
    for (let i = 0; i < spec.tasks.length; i++) {
      const task = spec.tasks[i];
      const taskNumber = i + 1;
      const taskId = taskIdMap.get(taskNumber);
      if (!taskId) continue;
      for (const depNumber of task.dependencies) {
        const depTaskId = taskIdMap.get(depNumber);
        if (depTaskId) {
          await ctx.db.insert("taskDependencies", {
            taskId,
            dependsOnId: depTaskId,
          });
        }
      }
    }
    await ctx.db.patch(args.projectId, {
      phase: "in_progress",
      branchName,
      description: spec.description,
    });
    return null;
  },
});

/** Creates a new active project from existing tasks, assigning them sequential task numbers. */
export const createFromTasks = authMutation({
  args: {
    repoId: v.id("githubRepos"),
    title: v.string(),
    taskIds: v.array(v.id("agentTasks")),
  },
  returns: v.id("projects"),
  handler: async (ctx, args) => {
    if (args.taskIds.length === 0) {
      throw new Error("At least one task is required");
    }
    const repo = await ctx.db.get(args.repoId);
    if (!repo) throw new Error("Repository not found");
    const projectId = await ctx.db.insert("projects", {
      repoId: args.repoId,
      userId: ctx.userId,
      title: args.title,
      rawInput: args.title,
      phase: "in_progress",
      baseBranch: repo.defaultBaseBranch ?? FALLBACK_GIT_BASE_BRANCH,
      projectStartDate: Date.now(),
    });
    await setProjectConversation(ctx.db, projectId, []);
    await ctx.db.patch(projectId, {
      branchName: buildProjectBranchName(projectId),
    });
    for (let i = 0; i < args.taskIds.length; i++) {
      const taskId = args.taskIds[i];
      const task = await ctx.db.get(taskId);
      if (task) {
        await ctx.db.patch(taskId, {
          projectId,
          taskNumber: i + 1,
          updatedAt: Date.now(),
        });
      }
    }
    await recomputeProjectPhase(ctx, projectId);
    return projectId;
  },
});
