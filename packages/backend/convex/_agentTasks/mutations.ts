import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { taskStatusValidator, claudeModelValidator } from "../validators";
import { createNotification } from "../notifications";
import {
  authMutation,
  hasRepoAccess,
  hasTaskAccess,
  deleteTaskRelatedData,
  recomputeProjectPhase,
} from "../functions";
import { normalizeTaskTags, buildTaskNotificationMessage } from "./helpers";

export const update = authMutation({
  args: {
    id: v.id("agentTasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    repoId: v.optional(v.id("githubRepos")),
    projectId: v.optional(v.union(v.id("projects"), v.null())),
    tags: v.optional(v.array(v.string())),
    taskNumber: v.optional(v.number()),
    assignedTo: v.optional(v.id("users")),
    model: v.optional(claudeModelValidator),
    baseBranch: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task || !(await hasTaskAccess(ctx.db, task, ctx.userId)))
      throw new Error("Task not found");
    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.repoId !== undefined) updates.repoId = args.repoId;
    if (args.projectId !== undefined)
      updates.projectId = args.projectId ?? undefined;
    if (args.tags !== undefined) updates.tags = normalizeTaskTags(args.tags);
    if (args.taskNumber !== undefined) updates.taskNumber = args.taskNumber;
    if (args.assignedTo !== undefined) updates.assignedTo = args.assignedTo;
    if (args.model !== undefined) updates.model = args.model;
    if (args.baseBranch !== undefined) updates.baseBranch = args.baseBranch;
    await ctx.db.patch(args.id, updates);
    if (args.assignedTo !== undefined && args.assignedTo !== task.assignedTo) {
      if (args.assignedTo && args.assignedTo !== ctx.userId) {
        await createNotification(ctx, {
          userId: args.assignedTo,
          type: "task_assigned",
          title: `Assigned: "${task.title}"`,
          repoId: task.repoId,
          projectId: task.projectId,
          taskId: args.id,
          message: buildTaskNotificationMessage(task, "assigned"),
        });
      }
    }
    return null;
  },
});

export const updateStatus = authMutation({
  args: {
    id: v.id("agentTasks"),
    status: taskStatusValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task || !(await hasTaskAccess(ctx.db, task, ctx.userId)))
      throw new Error("Task not found");
    const workStatuses = [
      "todo",
      "in_progress",
      "code_review",
      "business_review",
    ];
    if (workStatuses.includes(args.status)) {
      const dependencies = await ctx.db
        .query("taskDependencies")
        .withIndex("by_task", (q) => q.eq("taskId", args.id))
        .collect();
      for (const dep of dependencies) {
        const dependsOnTask = await ctx.db.get(dep.dependsOnId);
        if (dependsOnTask && dependsOnTask.status !== "done") {
          throw new Error(
            `Cannot move to ${args.status}: task is blocked by "${dependsOnTask.title}"`,
          );
        }
      }
    }
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
    if (args.status !== "todo" && task.scheduledFunctionId) {
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
    if (args.status === "done") {
      if (task.createdBy && task.createdBy !== ctx.userId) {
        await createNotification(ctx, {
          userId: task.createdBy,
          type: "task_complete",
          title: `Completed: "${task.title}"`,
          repoId: task.repoId,
          projectId: task.projectId,
          taskId: args.id,
          message: buildTaskNotificationMessage(task, "done"),
        });
      }
      if (
        task.assignedTo &&
        task.assignedTo !== ctx.userId &&
        task.assignedTo !== task.createdBy
      ) {
        await createNotification(ctx, {
          userId: task.assignedTo,
          type: "task_complete",
          title: `Completed: "${task.title}"`,
          repoId: task.repoId,
          projectId: task.projectId,
          taskId: args.id,
          message: buildTaskNotificationMessage(task, "done"),
        });
      }
    }
    if (task.projectId) {
      await recomputeProjectPhase(ctx.db, task.projectId);
    }
    return null;
  },
});

export const remove = authMutation({
  args: { id: v.id("agentTasks") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task || !(await hasTaskAccess(ctx.db, task, ctx.userId)))
      throw new Error("Task not found");
    await deleteTaskRelatedData(ctx, args.id);
    return null;
  },
});

export const createQuickTask = authMutation({
  args: {
    repoId: v.id("githubRepos"),
    title: v.string(),
    description: v.optional(v.string()),
    baseBranch: v.optional(v.string()),
    model: v.optional(claudeModelValidator),
  },
  returns: v.id("agentTasks"),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId)))
      throw new Error("Not authorized");
    const repo = await ctx.db.get(args.repoId);
    if (!repo) throw new Error("Repo not found");
    const now = Date.now();
    return await ctx.db.insert("agentTasks", {
      title: args.title,
      description: args.description,
      repoId: args.repoId,
      status: "todo",
      createdAt: now,
      updatedAt: now,
      createdBy: ctx.userId,
      baseBranch: args.baseBranch ?? repo.defaultBaseBranch ?? "main",
      model: args.model ?? repo.defaultModel,
    });
  },
});

export const createQuickTasksBatch = authMutation({
  args: {
    repoId: v.id("githubRepos"),
    tasks: v.array(
      v.object({
        title: v.string(),
        description: v.optional(v.string()),
      }),
    ),
  },
  returns: v.array(v.id("agentTasks")),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId)))
      throw new Error("Not authorized");
    const repo = await ctx.db.get(args.repoId);
    if (!repo) throw new Error("Repo not found");
    const now = Date.now();
    const taskIds: Id<"agentTasks">[] = [];
    for (const task of args.tasks) {
      const taskId = await ctx.db.insert("agentTasks", {
        title: task.title,
        description: task.description,
        repoId: args.repoId,
        status: "todo",
        createdAt: now,
        updatedAt: now,
        createdBy: ctx.userId,
        baseBranch: repo.defaultBaseBranch ?? "main",
        model: repo.defaultModel,
      });
      taskIds.push(taskId);
    }
    return taskIds;
  },
});

export const assignToProject = authMutation({
  args: {
    taskIds: v.array(v.id("agentTasks")),
    projectId: v.id("projects"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project || !(await hasRepoAccess(ctx.db, project.repoId, ctx.userId)))
      throw new Error("Project not found");
    if (args.taskIds.length === 0) {
      throw new Error("At least one task is required");
    }
    const existingProjectTaskIds = new Set<string>();
    const existingTasks = await ctx.db
      .query("agentTasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
    let maxTaskNumber = 0;
    for (const t of existingTasks) {
      existingProjectTaskIds.add(t._id);
      if (t.taskNumber !== undefined && t.taskNumber > maxTaskNumber) {
        maxTaskNumber = t.taskNumber;
      }
    }
    let assigned = 0;
    for (const taskId of args.taskIds) {
      if (existingProjectTaskIds.has(taskId)) continue;
      const task = await ctx.db.get(taskId);
      if (!task) throw new Error(`Task ${taskId} not found`);
      assigned++;
      await ctx.db.patch(taskId, {
        projectId: args.projectId,
        taskNumber: maxTaskNumber + assigned,
        updatedAt: Date.now(),
      });
    }
    return null;
  },
});

export const createBatchWithDependencies = authMutation({
  args: {
    repoId: v.id("githubRepos"),
    tasks: v.array(
      v.object({
        title: v.string(),
        description: v.optional(v.string()),
        dependsOn: v.optional(v.array(v.number())),
      }),
    ),
    projectTitle: v.optional(v.string()),
    baseBranch: v.optional(v.string()),
    model: v.optional(claudeModelValidator),
  },
  returns: v.object({
    taskIds: v.array(v.id("agentTasks")),
    projectId: v.optional(v.id("projects")),
  }),
  handler: async (ctx, args) => {
    if (args.tasks.length === 0) {
      throw new Error("At least one task is required");
    }
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId)))
      throw new Error("Not authorized");
    const repo = await ctx.db.get(args.repoId);
    if (!repo) throw new Error("Repo not found");

    const now = Date.now();
    const baseBranch = args.baseBranch ?? repo.defaultBaseBranch ?? "main";
    const model = args.model ?? repo.defaultModel;

    const taskIds: Id<"agentTasks">[] = [];
    for (let i = 0; i < args.tasks.length; i++) {
      const task = args.tasks[i];
      const taskId = await ctx.db.insert("agentTasks", {
        title: task.title,
        description: task.description,
        repoId: args.repoId,
        taskNumber: i + 1,
        status: "todo",
        createdAt: now,
        updatedAt: now,
        createdBy: ctx.userId,
        baseBranch,
        model,
      });
      taskIds.push(taskId);
    }

    for (let i = 0; i < args.tasks.length; i++) {
      const deps = args.tasks[i].dependsOn;
      if (!deps) continue;
      for (const depIndex of deps) {
        if (depIndex < 0 || depIndex >= args.tasks.length) {
          throw new Error(`Task ${i} has invalid dependency index ${depIndex}`);
        }
        if (depIndex === i) {
          throw new Error(`Task ${i} cannot depend on itself`);
        }
        await ctx.db.insert("taskDependencies", {
          taskId: taskIds[i],
          dependsOnId: taskIds[depIndex],
        });
      }
    }

    let projectId: Id<"projects"> | undefined;
    if (args.projectTitle) {
      projectId = await ctx.db.insert("projects", {
        repoId: args.repoId,
        userId: ctx.userId,
        title: args.projectTitle,
        rawInput: args.projectTitle,
        phase: "active",
        baseBranch,
        projectStartDate: now,
      });
      await ctx.db.patch(projectId, {
        branchName: `eva/project-${projectId}`,
      });
      for (const taskId of taskIds) {
        await ctx.db.patch(taskId, { projectId });
      }
    }

    return { taskIds, projectId };
  },
});

export const deleteCascade = authMutation({
  args: { id: v.id("agentTasks") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task || !(await hasTaskAccess(ctx.db, task, ctx.userId)))
      throw new Error("Task not found");
    const tasksToDelete: Id<"agentTasks">[] = [args.id];
    const collectDependents = async (taskId: Id<"agentTasks">) => {
      const dependents = await ctx.db
        .query("taskDependencies")
        .withIndex("by_dependency", (q) => q.eq("dependsOnId", taskId))
        .collect();
      for (const dep of dependents) {
        if (!tasksToDelete.includes(dep.taskId)) {
          tasksToDelete.push(dep.taskId);
          await collectDependents(dep.taskId);
        }
      }
    };
    await collectDependents(args.id);
    for (const taskId of tasksToDelete) {
      await deleteTaskRelatedData(ctx, taskId);
    }
    return null;
  },
});
