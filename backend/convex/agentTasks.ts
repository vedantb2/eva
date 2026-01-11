import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const taskStatusValidator = v.union(
  v.literal("idle"),
  v.literal("queued"),
  v.literal("running"),
  v.literal("reviewing"),
  v.literal("completed"),
  v.literal("failed")
);

const agentTaskValidator = v.object({
  _id: v.id("agentTasks"),
  _creationTime: v.number(),
  boardId: v.id("boards"),
  columnId: v.id("columns"),
  title: v.string(),
  description: v.optional(v.string()),
  repoId: v.optional(v.id("githubRepos")),
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

export const create = mutation({
  args: {
    columnId: v.id("columns"),
    title: v.string(),
    description: v.optional(v.string()),
    repoId: v.optional(v.id("githubRepos")),
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
      repoId: args.repoId,
      status: "idle",
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
    repoId: v.optional(v.id("githubRepos")),
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
    const updates: {
      title?: string;
      description?: string;
      repoId?: ReturnType<typeof v.id<"githubRepos">>;
      updatedAt: number;
    } = { updatedAt: Date.now() };
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.repoId !== undefined) updates.repoId = args.repoId;
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
    const tasksInTarget = await ctx.db
      .query("agentTasks")
      .withIndex("by_column", (q) => q.eq("columnId", args.columnId))
      .collect();
    const maxOrder = tasksInTarget.reduce((max, t) => Math.max(max, t.order), -1);
    let runId: ReturnType<typeof v.id<"agentRuns">> | null = null;
    if (targetColumn.isRunColumn && task.status === "idle") {
      runId = await ctx.db.insert("agentRuns", {
        taskId: args.id,
        status: "queued",
        logs: [],
        startedAt: Date.now(),
      });
      await ctx.db.patch(args.id, {
        columnId: args.columnId,
        order: maxOrder + 1,
        status: "queued",
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
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
    return null;
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
    await ctx.db.delete(args.id);
    return null;
  },
});
