import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { authMutation } from "../functions";
import {
  AUDIT_TASKS,
  parseSpec,
  getProjectGeneratedSpec,
  setProjectConversation,
} from "./helpers";

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
    const branchName = `eva/project-${args.projectId}`;
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
      });
      taskIdMap.set(taskNumber, taskId);
      for (let j = 0; j < task.subtasks.length; j++) {
        await ctx.db.insert("subtasks", {
          parentTaskId: taskId,
          title: task.subtasks[j],
          completed: false,
          order: j,
        });
      }
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
    const specTaskIds = [...taskIdMap.values()];
    for (let i = 0; i < AUDIT_TASKS.length; i++) {
      const audit = AUDIT_TASKS[i];
      const taskNumber = spec.tasks.length + i + 1;
      const auditTaskId = await ctx.db.insert("agentTasks", {
        title: audit.title,
        description: audit.description,
        repoId: project.repoId,
        projectId: args.projectId,
        taskNumber,
        status: "todo",
        createdAt: now,
        updatedAt: now,
        createdBy: ctx.userId,
      });
      for (let j = 0; j < audit.subtasks.length; j++) {
        await ctx.db.insert("subtasks", {
          parentTaskId: auditTaskId,
          title: audit.subtasks[j],
          completed: false,
          order: j,
        });
      }
      for (const depId of specTaskIds) {
        await ctx.db.insert("taskDependencies", {
          taskId: auditTaskId,
          dependsOnId: depId,
        });
      }
    }
    await ctx.db.patch(args.projectId, {
      phase: "active",
      branchName,
      description: spec.description,
    });
    return null;
  },
});

export const createFromTasks = authMutation({
  args: {
    repoId: v.id("githubRepos"),
    title: v.string(),
    taskIds: v.array(v.id("agentTasks")),
  },
  returns: v.id("projects"),
  handler: async (ctx, args) => {
    const projectId = await ctx.db.insert("projects", {
      repoId: args.repoId,
      userId: ctx.userId,
      title: args.title,
      rawInput: args.title,
      phase: "active",
      projectStartDate: Date.now(),
    });
    await setProjectConversation(ctx.db, projectId, []);
    await ctx.db.patch(projectId, {
      branchName: `eva/project-${projectId}`,
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
    return projectId;
  },
});
