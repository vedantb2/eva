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
  hasActiveRun,
  isFirstTaskOnBranch,
  deleteTaskRelatedData,
  recomputeProjectPhase,
} from "./functions";
import { workflow } from "./workflowManager";

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

function buildTaskNotificationMessage(
  task: {
    projectId?: Id<"projects">;
    status: string;
    description?: string;
    taskNumber?: number;
  },
  action: "assigned" | "done",
): string {
  const scopeLabel = task.projectId ? "Project task" : "Quick task";
  const taskNumberLabel =
    task.taskNumber === undefined ? "" : `Task #${task.taskNumber}. `;
  const description = task.description?.trim();
  const summary =
    description && description.length > 180
      ? `${description.slice(0, 177)}...`
      : description;
  if (action === "assigned") {
    const message = `${scopeLabel}. ${taskNumberLabel}Status: ${task.status.replace(/_/g, " ")}.`;
    return summary ? `${message} ${summary}` : message;
  }
  const message = `${scopeLabel}. ${taskNumberLabel}Status changed to done.`;
  return summary ? `${message} ${summary}` : message;
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
  createdAt: v.number(),
  updatedAt: v.number(),
  createdBy: v.optional(v.id("users")),
  assignedTo: v.optional(v.id("users")),
  model: v.optional(claudeModelValidator),
  baseBranch: v.optional(v.string()),
  activeWorkflowId: v.optional(v.string()),
  scheduledAt: v.optional(v.number()),
  scheduledFunctionId: v.optional(v.id("_scheduled_functions")),
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
    await deleteTaskRelatedData(ctx, args.id);
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
    return tasks
      .filter((t) => t.status !== "draft")
      .sort((a, b) => a.createdAt - b.createdAt);
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
    const now = Date.now();
    return await ctx.db.insert("agentTasks", {
      title: args.title,
      description: args.description,
      repoId: args.repoId,
      status: "todo",
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
          branchName: task.projectId ? `project/${task.projectId}` : undefined,
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
      branchName: task.projectId ? `project/${task.projectId}` : undefined,
      baseBranch: task.baseBranch,
      isFirstTaskOnBranch: firstOnBranch,
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
        | "draft"
        | "todo"
        | "in_progress"
        | "business_review"
        | "code_review"
        | "done"
        | "cancelled";
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
      await deleteTaskRelatedData(ctx, taskId);
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

export const listDrafts = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(agentTaskValidator),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) return [];
    const tasks = await ctx.db
      .query("agentTasks")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
    return tasks
      .filter((t) => t.status === "draft" && t.createdBy === ctx.userId)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const saveDraft = authMutation({
  args: {
    id: v.optional(v.id("agentTasks")),
    repoId: v.id("githubRepos"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    baseBranch: v.optional(v.string()),
  },
  returns: v.id("agentTasks"),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId)))
      throw new Error("Not authorized");

    const now = Date.now();

    if (args.id) {
      const existing = await ctx.db.get(args.id);
      if (
        !existing ||
        existing.createdBy !== ctx.userId ||
        existing.status !== "draft"
      )
        throw new Error("Draft not found");
      await ctx.db.patch(args.id, {
        title: args.title ?? "",
        description: args.description,
        baseBranch: args.baseBranch,
        updatedAt: now,
      });
      return args.id;
    }

    return await ctx.db.insert("agentTasks", {
      title: args.title ?? "",
      description: args.description,
      repoId: args.repoId,
      status: "draft",
      createdAt: now,
      updatedAt: now,
      createdBy: ctx.userId,
      baseBranch: args.baseBranch,
    });
  },
});

export const activateDraft = authMutation({
  args: {
    id: v.id("agentTasks"),
    title: v.string(),
    description: v.optional(v.string()),
    baseBranch: v.optional(v.string()),
    model: v.optional(claudeModelValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task || task.createdBy !== ctx.userId || task.status !== "draft")
      throw new Error("Draft not found");

    await ctx.db.patch(args.id, {
      title: args.title,
      description: args.description,
      baseBranch: args.baseBranch ?? "staging",
      model: args.model,
      status: "todo",
      updatedAt: Date.now(),
    });
    if (task.projectId) {
      await recomputeProjectPhase(ctx.db, task.projectId);
    }
    return null;
  },
});
