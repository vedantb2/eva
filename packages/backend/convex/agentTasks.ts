import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { taskStatusValidator, claudeModelValidator } from "./validators";
import { createNotification } from "./notifications";
import {
  authQuery,
  authMutation,
  hasRepoAccess,
  hasTaskAccess,
} from "./functions";

function normalizeTaskTags(tags: string[] | undefined): string[] | undefined {
  if (tags === undefined) {
    return undefined;
  }
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const rawTag of tags) {
    const tag = rawTag.trim();
    if (!tag || seen.has(tag)) {
      continue;
    }
    seen.add(tag);
    normalized.push(tag);
  }
  return normalized;
}

const agentTaskValidator = v.object({
  _id: v.id("agentTasks"),
  _creationTime: v.number(),
  title: v.string(),
  description: v.optional(v.string()),
  repoId: v.optional(v.id("githubRepos")),
  projectId: v.optional(v.id("projects")),
  tags: v.optional(v.array(v.string())),
  taskNumber: v.optional(v.number()),
  status: taskStatusValidator,
  order: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
  createdBy: v.optional(v.id("users")),
  assignedTo: v.optional(v.id("users")),
  model: v.optional(claudeModelValidator),
  baseBranch: v.optional(v.string()),
  activeWorkflowId: v.optional(v.string()),
  scheduledAt: v.optional(v.number()),
  scheduledFunctionId: v.optional(v.string()),
});

export const listByProject = authQuery({
  args: { projectId: v.id("projects") },
  returns: v.array(agentTaskValidator),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project || !(await hasRepoAccess(ctx.db, project.repoId, ctx.userId)))
      return [];
    return await ctx.db
      .query("agentTasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

export const get = authQuery({
  args: { id: v.id("agentTasks") },
  returns: v.union(agentTaskValidator, v.null()),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task || !(await hasTaskAccess(ctx.db, task, ctx.userId))) return null;
    return task;
  },
});

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
          title: `You were assigned to "${task.title}"`,
          repoId: task.repoId,
          projectId: task.projectId,
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
    if (args.status === "in_progress") {
      const dependencies = await ctx.db
        .query("taskDependencies")
        .withIndex("by_task", (q) => q.eq("taskId", args.id))
        .collect();
      for (const dep of dependencies) {
        const dependsOnTask = await ctx.db.get(dep.dependsOnId);
        if (dependsOnTask && dependsOnTask.status !== "done") {
          throw new Error(
            `Task is blocked by incomplete dependency: ${dependsOnTask.title}`,
          );
        }
      }
    }
    const workStatuses = [
      "todo",
      "in_progress",
      "business_review",
      "code_review",
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
        await ctx.scheduler.cancel(
          task.scheduledFunctionId as Id<"_scheduled_functions">,
        );
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
          title: `Task "${task.title}" is done`,
          repoId: task.repoId,
          projectId: task.projectId,
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
          title: `Task "${task.title}" is done`,
          repoId: task.repoId,
          projectId: task.projectId,
        });
      }
    }
    if (task.projectId) {
      const project = await ctx.db.get(task.projectId);
      if (project) {
        if (args.status === "done") {
          const projectTasks = await ctx.db
            .query("agentTasks")
            .withIndex("by_project", (q) => q.eq("projectId", task.projectId))
            .collect();
          const allDone = projectTasks.every((t) =>
            t._id === args.id ? true : t.status === "done",
          );
          if (allDone && project.phase !== "completed") {
            await ctx.db.patch(task.projectId, { phase: "completed" });
          }
        } else {
          if (project.phase === "finalized") {
            await ctx.db.patch(task.projectId, { phase: "active" });
          }
        }
      }
    }
    return null;
  },
});

export const getActiveTasks = authQuery({
  args: { repoId: v.optional(v.id("githubRepos")) },
  returns: v.array(agentTaskValidator),
  handler: async (ctx, args) => {
    const allRepos = await ctx.db.query("githubRepos").collect();
    const accessibleRepoIds = new Set(
      (
        await Promise.all(
          allRepos.map(async (r) =>
            (await hasRepoAccess(ctx.db, r._id, ctx.userId)) ? r._id : null,
          ),
        )
      ).filter((id): id is Id<"githubRepos"> => id !== null),
    );
    const tasks = await ctx.db.query("agentTasks").collect();
    const active = tasks.filter(
      (t) =>
        t.repoId &&
        accessibleRepoIds.has(t.repoId) &&
        (!args.repoId || t.repoId === args.repoId) &&
        (t.status === "todo" ||
          t.status === "in_progress" ||
          t.status === "business_review" ||
          t.status === "code_review"),
    );
    return active.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const remove = authMutation({
  args: { id: v.id("agentTasks") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task || !(await hasTaskAccess(ctx.db, task, ctx.userId)))
      throw new Error("Task not found");
    const runs = await ctx.db
      .query("agentRuns")
      .withIndex("by_task", (q) => q.eq("taskId", args.id))
      .collect();
    for (const run of runs) {
      await ctx.db.delete(run._id);
    }
    const dependencies = await ctx.db
      .query("taskDependencies")
      .withIndex("by_task", (q) => q.eq("taskId", args.id))
      .collect();
    for (const dep of dependencies) {
      await ctx.db.delete(dep._id);
    }
    const dependents = await ctx.db
      .query("taskDependencies")
      .withIndex("by_dependency", (q) => q.eq("dependsOnId", args.id))
      .collect();
    for (const dep of dependents) {
      await ctx.db.delete(dep._id);
    }
    await ctx.db.delete(args.id);
    return null;
  },
});

export const getAllTasks = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(agentTaskValidator),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) return [];
    const tasks = await ctx.db
      .query("agentTasks")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
    return tasks.sort((a, b) => a.order - b.order);
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
    const tasks = await ctx.db
      .query("agentTasks")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
    const maxOrder = tasks.reduce((max, t) => Math.max(max, t.order), -1);
    const now = Date.now();
    return await ctx.db.insert("agentTasks", {
      title: args.title,
      description: args.description,
      repoId: args.repoId,
      status: "todo",
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
      createdBy: ctx.userId,
      baseBranch: args.baseBranch ?? "staging",
      model: args.model,
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
    baseBranch: v.optional(v.string()),
  },
  returns: v.array(v.id("agentTasks")),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId)))
      throw new Error("Not authorized");
    const existingTasks = await ctx.db
      .query("agentTasks")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
    let maxOrder = existingTasks.reduce((max, t) => Math.max(max, t.order), -1);
    const now = Date.now();
    const taskIds: Id<"agentTasks">[] = [];
    for (const task of args.tasks) {
      maxOrder += 1;
      const taskId = await ctx.db.insert("agentTasks", {
        title: task.title,
        description: task.description,
        repoId: args.repoId,
        status: "todo",
        order: maxOrder,
        createdAt: now,
        updatedAt: now,
        createdBy: ctx.userId,
        baseBranch: args.baseBranch ?? "staging",
      });
      taskIds.push(taskId);
    }
    return taskIds;
  },
});

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
    if (!task.repoId) {
      throw new Error("Task has no associated repository");
    }
    const repo = await ctx.db.get(task.repoId);
    if (!repo) {
      throw new Error("Repository not found");
    }
    if (task.scheduledFunctionId) {
      try {
        await ctx.scheduler.cancel(
          task.scheduledFunctionId as Id<"_scheduled_functions">,
        );
      } catch {
        // may have already fired
      }
      await ctx.db.patch(args.id, {
        scheduledAt: undefined,
        scheduledFunctionId: undefined,
      });
    }

    const activeQueuedRun = await ctx.db
      .query("agentRuns")
      .withIndex("by_task_and_status", (q) =>
        q.eq("taskId", args.id).eq("status", "queued"),
      )
      .first();
    const activeRunningRun = await ctx.db
      .query("agentRuns")
      .withIndex("by_task_and_status", (q) =>
        q.eq("taskId", args.id).eq("status", "running"),
      )
      .first();
    if (activeQueuedRun || activeRunningRun) {
      throw new Error("Task already has an active execution");
    }

    let project = null;
    let isFirstTaskOnBranch = true;

    if (task.projectId) {
      project = await ctx.db.get(task.projectId);
      if (!project) {
        throw new Error("Project not found");
      }

      const projectTasks = await ctx.db
        .query("agentTasks")
        .withIndex("by_project", (q) => q.eq("projectId", task.projectId))
        .collect();

      for (const pt of projectTasks) {
        if (pt._id === args.id) continue;
        const queuedRun = await ctx.db
          .query("agentRuns")
          .withIndex("by_task_and_status", (q) =>
            q.eq("taskId", pt._id).eq("status", "queued"),
          )
          .first();
        if (queuedRun) {
          throw new Error("Another task in this project is already running");
        }
        const runningRun = await ctx.db
          .query("agentRuns")
          .withIndex("by_task_and_status", (q) =>
            q.eq("taskId", pt._id).eq("status", "running"),
          )
          .first();
        if (runningRun) {
          throw new Error("Another task in this project is already running");
        }
      }

      for (const pt of projectTasks) {
        const successRun = await ctx.db
          .query("agentRuns")
          .withIndex("by_task_and_status", (q) =>
            q.eq("taskId", pt._id).eq("status", "success"),
          )
          .first();
        if (successRun) {
          isFirstTaskOnBranch = false;
          break;
        }
      }
    }

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
    return {
      runId,
      taskId: args.id,
      repoId: task.repoId,
      installationId: repo.installationId,
      projectId: task.projectId,
      branchName: project?.branchName,
      baseBranch: task.baseBranch,
      isFirstTaskOnBranch,
      model: task.model ?? repo.defaultModel,
    };
  },
});

export const getDependentTasks = authQuery({
  args: { taskId: v.id("agentTasks") },
  returns: v.array(
    v.object({
      _id: v.id("agentTasks"),
      title: v.string(),
      taskNumber: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || !(await hasTaskAccess(ctx.db, task, ctx.userId))) return [];
    const dependents = await ctx.db
      .query("taskDependencies")
      .withIndex("by_dependency", (q) => q.eq("dependsOnId", args.taskId))
      .collect();
    const result = [];
    for (const dep of dependents) {
      const task = await ctx.db.get(dep.taskId);
      if (task) {
        result.push({
          _id: task._id,
          title: task.title,
          taskNumber: task.taskNumber,
        });
      }
    }
    return result;
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
    for (const taskId of args.taskIds) {
      const task = await ctx.db.get(taskId);
      if (task) {
        await ctx.db.patch(taskId, {
          projectId: args.projectId,
          updatedAt: Date.now(),
        });
      }
    }
    return null;
  },
});

export const getStatusesByIds = authQuery({
  args: { ids: v.array(v.id("agentTasks")) },
  returns: v.array(
    v.object({
      id: v.id("agentTasks"),
      status: taskStatusValidator,
    }),
  ),
  handler: async (ctx, args) => {
    const results: {
      id: Id<"agentTasks">;
      status:
        | "todo"
        | "in_progress"
        | "business_review"
        | "code_review"
        | "done";
    }[] = [];
    for (const id of args.ids) {
      const task = await ctx.db.get(id);
      if (task) results.push({ id: task._id, status: task.status });
    }
    return results;
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
      const taskToDelete = await ctx.db.get(taskId);
      if (taskToDelete?.scheduledFunctionId) {
        try {
          await ctx.scheduler.cancel(
            taskToDelete.scheduledFunctionId as Id<"_scheduled_functions">,
          );
        } catch {
          // may have already fired
        }
      }
      const runs = await ctx.db
        .query("agentRuns")
        .withIndex("by_task", (q) => q.eq("taskId", taskId))
        .collect();
      for (const run of runs) {
        await ctx.db.delete(run._id);
      }
      const dependencies = await ctx.db
        .query("taskDependencies")
        .withIndex("by_task", (q) => q.eq("taskId", taskId))
        .collect();
      for (const dep of dependencies) {
        await ctx.db.delete(dep._id);
      }
      const dependents = await ctx.db
        .query("taskDependencies")
        .withIndex("by_dependency", (q) => q.eq("dependsOnId", taskId))
        .collect();
      for (const dep of dependents) {
        await ctx.db.delete(dep._id);
      }
      await ctx.db.delete(taskId);
    }
    return null;
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
      scheduledFunctionId: String(functionId),
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
      await ctx.scheduler.cancel(
        task.scheduledFunctionId as Id<"_scheduled_functions">,
      );
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
        await ctx.scheduler.cancel(
          task.scheduledFunctionId as Id<"_scheduled_functions">,
        );
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
      scheduledFunctionId: String(functionId),
      updatedAt: Date.now(),
    });
    return null;
  },
});
