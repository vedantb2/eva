import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

const taskStatusValidator = v.union(
  v.literal("todo"),
  v.literal("in_progress"),
  v.literal("code_review"),
  v.literal("done")
);

const agentTaskValidator = v.object({
  _id: v.id("agentTasks"),
  _creationTime: v.number(),
  boardId: v.id("boards"),
  columnId: v.id("columns"),
  title: v.string(),
  description: v.optional(v.string()),
  branchName: v.optional(v.string()),
  repoId: v.optional(v.id("githubRepos")),
  projectId: v.optional(v.id("projects")),
  taskNumber: v.optional(v.number()),
  status: taskStatusValidator,
  order: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const listByBoard = query({
  args: { boardId: v.id("boards") },
  returns: v.array(agentTaskValidator),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const board = await ctx.db.get(args.boardId);
    if (!board || board.ownerId !== identity.subject) {
      return [];
    }
    return await ctx.db
      .query("agentTasks")
      .withIndex("by_board", (q) => q.eq("boardId", args.boardId))
      .collect();
  },
});

export const listByColumn = query({
  args: { columnId: v.id("columns") },
  returns: v.array(agentTaskValidator),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const column = await ctx.db.get(args.columnId);
    if (!column) {
      return [];
    }
    const board = await ctx.db.get(column.boardId);
    if (!board || board.ownerId !== identity.subject) {
      return [];
    }
    const tasks = await ctx.db
      .query("agentTasks")
      .withIndex("by_column", (q) => q.eq("columnId", args.columnId))
      .collect();
    return tasks.sort((a, b) => a.order - b.order);
  },
});

export const listByProject = query({
  args: { projectId: v.id("projects") },
  returns: v.array(agentTaskValidator),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    return await ctx.db
      .query("agentTasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("agentTasks") },
  returns: v.union(agentTaskValidator, v.null()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    const task = await ctx.db.get(args.id);
    if (!task) {
      return null;
    }
    const board = await ctx.db.get(task.boardId);
    if (!board || board.ownerId !== identity.subject) {
      return null;
    }
    return task;
  },
});

export const getNoAuth = query({
  args: { id: v.id("agentTasks") },
  returns: v.union(agentTaskValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    columnId: v.id("columns"),
    title: v.string(),
    description: v.optional(v.string()),
    branchName: v.optional(v.string()),
    repoId: v.optional(v.id("githubRepos")),
    projectId: v.optional(v.id("projects")),
    taskNumber: v.optional(v.number()),
    status: v.optional(taskStatusValidator),
  },
  returns: v.id("agentTasks"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const column = await ctx.db.get(args.columnId);
    if (!column) {
      throw new Error("Column not found");
    }
    const board = await ctx.db.get(column.boardId);
    if (!board || board.ownerId !== identity.subject) {
      throw new Error("Column not found");
    }
    const tasks = await ctx.db
      .query("agentTasks")
      .withIndex("by_column", (q) => q.eq("columnId", args.columnId))
      .collect();
    const maxOrder = tasks.reduce((max, t) => Math.max(max, t.order), -1);
    const now = Date.now();
    return await ctx.db.insert("agentTasks", {
      boardId: column.boardId,
      columnId: args.columnId,
      title: args.title,
      description: args.description,
      branchName: args.branchName,
      repoId: args.repoId,
      projectId: args.projectId,
      taskNumber: args.taskNumber,
      status: args.status ?? "todo",
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("agentTasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    branchName: v.optional(v.string()),
    repoId: v.optional(v.id("githubRepos")),
    projectId: v.optional(v.id("projects")),
    taskNumber: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const task = await ctx.db.get(args.id);
    if (!task) {
      throw new Error("Task not found");
    }
    const board = await ctx.db.get(task.boardId);
    if (!board || board.ownerId !== identity.subject) {
      throw new Error("Task not found");
    }
    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.branchName !== undefined) updates.branchName = args.branchName;
    if (args.repoId !== undefined) updates.repoId = args.repoId;
    if (args.projectId !== undefined) updates.projectId = args.projectId;
    if (args.taskNumber !== undefined) updates.taskNumber = args.taskNumber;
    await ctx.db.patch(args.id, updates);
    return null;
  },
});

export const moveToColumn = mutation({
  args: {
    id: v.id("agentTasks"),
    columnId: v.id("columns"),
  },
  returns: v.union(v.id("agentRuns"), v.null()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const task = await ctx.db.get(args.id);
    if (!task) {
      throw new Error("Task not found");
    }
    const board = await ctx.db.get(task.boardId);
    if (!board || board.ownerId !== identity.subject) {
      throw new Error("Task not found");
    }
    const targetColumn = await ctx.db.get(args.columnId);
    if (!targetColumn || targetColumn.boardId !== task.boardId) {
      throw new Error("Column not found");
    }
    if (task.columnId === args.columnId) {
      return null;
    }
    if (targetColumn.isRunColumn) {
      const dependencies = await ctx.db
        .query("taskDependencies")
        .withIndex("by_task", (q) => q.eq("taskId", args.id))
        .collect();
      for (const dep of dependencies) {
        const dependsOnTask = await ctx.db.get(dep.dependsOnId);
        if (dependsOnTask && dependsOnTask.status !== "done") {
          throw new Error(
            `Task is blocked by incomplete dependency: ${dependsOnTask.title}`
          );
        }
      }
    }
    const tasksInTarget = await ctx.db
      .query("agentTasks")
      .withIndex("by_column", (q) => q.eq("columnId", args.columnId))
      .collect();
    const maxOrder = tasksInTarget.reduce((max, t) => Math.max(max, t.order), -1);
    let runId: Id<"agentRuns"> | null = null;
    if (targetColumn.isRunColumn && task.status === "todo") {
      runId = await ctx.db.insert("agentRuns", {
        taskId: args.id,
        status: "queued",
        logs: [],
        startedAt: Date.now(),
      });
      await ctx.scheduler.runAfter(0, internal.agentExecution.trigger, {
        runId,
      });
      await ctx.db.patch(args.id, {
        columnId: args.columnId,
        order: maxOrder + 1,
        status: "todo",
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.patch(args.id, {
        columnId: args.columnId,
        order: maxOrder + 1,
        updatedAt: Date.now(),
      });
    }
    return runId;
  },
});

export const updateOrder = mutation({
  args: {
    id: v.id("agentTasks"),
    order: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const task = await ctx.db.get(args.id);
    if (!task) {
      throw new Error("Task not found");
    }
    const board = await ctx.db.get(task.boardId);
    if (!board || board.ownerId !== identity.subject) {
      throw new Error("Task not found");
    }
    await ctx.db.patch(args.id, {
      order: args.order,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("agentTasks"),
    status: taskStatusValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const task = await ctx.db.get(args.id);
    if (!task) {
      throw new Error("Task not found");
    }
    const board = await ctx.db.get(task.boardId);
    if (!board || board.ownerId !== identity.subject) {
      throw new Error("Task not found");
    }
    const workStatuses = ["todo", "in_progress", "code_review"];
    if (workStatuses.includes(args.status)) {
      const dependencies = await ctx.db
        .query("taskDependencies")
        .withIndex("by_task", (q) => q.eq("taskId", args.id))
        .collect();
      for (const dep of dependencies) {
        const dependsOnTask = await ctx.db.get(dep.dependsOnId);
        if (dependsOnTask && dependsOnTask.status !== "done") {
          throw new Error(
            `Cannot move to ${args.status}: task is blocked by "${dependsOnTask.title}"`
          );
        }
      }
    }
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
    if (task.projectId) {
      const project = await ctx.db.get(task.projectId);
      if (project) {
        if (args.status === "done") {
          const projectTasks = await ctx.db
            .query("agentTasks")
            .withIndex("by_project", (q) => q.eq("projectId", task.projectId))
            .collect();
          const allDone = projectTasks.every(
            (t) => t._id === args.id ? true : t.status === "done"
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

export const getActiveTasks = query({
  args: { repoId: v.optional(v.id("githubRepos")) },
  returns: v.array(agentTaskValidator),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const boards = await ctx.db.query("boards").collect();
    const ownedBoards = boards.filter((b) => b.ownerId === identity.subject);
    const relevantBoards = args.repoId
      ? ownedBoards.filter((b) => b.repoId === args.repoId)
      : ownedBoards;
    const activeTasks = [];
    for (const board of relevantBoards) {
      const tasks = await ctx.db
        .query("agentTasks")
        .withIndex("by_board", (q) => q.eq("boardId", board._id))
        .collect();
      const active = tasks.filter(
        (t) => t.status === "todo" || t.status === "in_progress" || t.status === "code_review"
      );
      activeTasks.push(...active);
    }
    return activeTasks.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const remove = mutation({
  args: { id: v.id("agentTasks") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const task = await ctx.db.get(args.id);
    if (!task) {
      throw new Error("Task not found");
    }
    const board = await ctx.db.get(task.boardId);
    if (!board || board.ownerId !== identity.subject) {
      throw new Error("Task not found");
    }
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

export const getAllTasks = query({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(agentTaskValidator),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const boards = await ctx.db
      .query("boards")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
    const ownedBoards = boards.filter((b) => b.ownerId === identity.subject);
    const allTasks = [];
    for (const board of ownedBoards) {
      const tasks = await ctx.db
        .query("agentTasks")
        .withIndex("by_board", (q) => q.eq("boardId", board._id))
        .collect();
      allTasks.push(...tasks);
    }
    return allTasks.sort((a, b) => a.order - b.order);
  },
});

export const createQuickTask = mutation({
  args: {
    repoId: v.id("githubRepos"),
    title: v.string(),
    description: v.optional(v.string()),
  },
  returns: v.id("agentTasks"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    let board = await ctx.db
      .query("boards")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .first();
    if (!board) {
      const boardId = await ctx.db.insert("boards", {
        name: "Quick Tasks",
        ownerId: identity.subject,
        repoId: args.repoId,
        createdAt: Date.now(),
      });
      await ctx.db.insert("columns", {
        boardId,
        name: "Backlog",
        order: 0,
        isRunColumn: false,
      });
      board = await ctx.db.get(boardId);
    }
    if (!board) {
      throw new Error("Failed to create board");
    }
    let column = await ctx.db
      .query("columns")
      .withIndex("by_board", (q) => q.eq("boardId", board._id))
      .first();
    if (!column) {
      const columnId = await ctx.db.insert("columns", {
        boardId: board._id,
        name: "Backlog",
        order: 0,
        isRunColumn: false,
      });
      column = await ctx.db.get(columnId);
    }
    if (!column) {
      throw new Error("Failed to create column");
    }
    const tasks = await ctx.db
      .query("agentTasks")
      .withIndex("by_column", (q) => q.eq("columnId", column._id))
      .collect();
    const maxOrder = tasks.reduce((max, t) => Math.max(max, t.order), -1);
    const now = Date.now();
    return await ctx.db.insert("agentTasks", {
      boardId: board._id,
      columnId: column._id,
      title: args.title,
      description: args.description,
      repoId: args.repoId,
      status: "todo",
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const startExecution = mutation({
  args: { id: v.id("agentTasks") },
  returns: v.object({
    runId: v.id("agentRuns"),
    taskId: v.id("agentTasks"),
    repoId: v.id("githubRepos"),
    installationId: v.number(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const task = await ctx.db.get(args.id);
    if (!task) {
      throw new Error("Task not found");
    }
    const board = await ctx.db.get(task.boardId);
    if (!board || board.ownerId !== identity.subject) {
      throw new Error("Task not found");
    }
    if (!task.repoId) {
      throw new Error("Task has no associated repository");
    }
    const repo = await ctx.db.get(task.repoId);
    if (!repo) {
      throw new Error("Repository not found");
    }
    const existingRuns = await ctx.db
      .query("agentRuns")
      .withIndex("by_task", (q) => q.eq("taskId", args.id))
      .collect();
    const activeRun = existingRuns.find(
      (r) => r.status === "queued" || r.status === "running"
    );
    if (activeRun) {
      throw new Error("Task already has an active execution");
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
    };
  },
});

export const getDependentTasks = query({
  args: { taskId: v.id("agentTasks") },
  returns: v.array(
    v.object({
      _id: v.id("agentTasks"),
      title: v.string(),
      taskNumber: v.optional(v.number()),
    })
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
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

export const deleteCascade = mutation({
  args: { id: v.id("agentTasks") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const task = await ctx.db.get(args.id);
    if (!task) {
      throw new Error("Task not found");
    }
    const board = await ctx.db.get(task.boardId);
    if (!board || board.ownerId !== identity.subject) {
      throw new Error("Task not found");
    }
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
