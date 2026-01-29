import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { taskStatusValidator } from "./validators";

const boardValidator = v.object({
  _id: v.id("boards"),
  _creationTime: v.number(),
  name: v.string(),
  ownerId: v.string(),
  repoId: v.optional(v.id("githubRepos")),
  createdAt: v.number(),
});

const columnValidator = v.object({
  _id: v.id("columns"),
  _creationTime: v.number(),
  boardId: v.id("boards"),
  name: v.string(),
  order: v.number(),
  isRunColumn: v.optional(v.boolean()),
});

const agentTaskValidator = v.object({
  _id: v.id("agentTasks"),
  _creationTime: v.number(),
  boardId: v.id("boards"),
  columnId: v.id("columns"),
  title: v.string(),
  description: v.optional(v.string()),
  repoId: v.optional(v.id("githubRepos")),
  branchName: v.optional(v.string()),
  projectId: v.optional(v.id("projects")),
  taskNumber: v.optional(v.number()),
  status: taskStatusValidator,
  order: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const list = query({
  args: {},
  returns: v.array(boardValidator),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    return await ctx.db
      .query("boards")
      .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))
      .collect();
  },
});

export const listByRepo = query({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(boardValidator),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const boards = await ctx.db
      .query("boards")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
    return boards.filter((b) => b.ownerId === identity.subject);
  },
});

export const get = query({
  args: { id: v.id("boards") },
  returns: v.union(boardValidator, v.null()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    const board = await ctx.db.get(args.id);
    if (!board || board.ownerId !== identity.subject) {
      return null;
    }
    return board;
  },
});

export const getWithColumns = query({
  args: { id: v.id("boards") },
  returns: v.union(
    v.object({
      board: boardValidator,
      columns: v.array(
        v.object({
          ...columnValidator.fields,
          tasks: v.array(agentTaskValidator),
        })
      ),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    const board = await ctx.db.get(args.id);
    if (!board || board.ownerId !== identity.subject) {
      return null;
    }
    const columns = await ctx.db
      .query("columns")
      .withIndex("by_board", (q) => q.eq("boardId", args.id))
      .collect();
    const sortedColumns = columns.sort((a, b) => a.order - b.order);
    const tasks = await ctx.db
      .query("agentTasks")
      .withIndex("by_board", (q) => q.eq("boardId", args.id))
      .collect();
    const columnsWithTasks = sortedColumns.map((col) => ({
      ...col,
      tasks: tasks
        .filter((t) => t.columnId === col._id)
        .sort((a, b) => a.order - b.order),
    }));
    return { board, columns: columnsWithTasks };
  },
});

export const create = mutation({
  args: { name: v.string(), repoId: v.optional(v.id("githubRepos")) },
  returns: v.id("boards"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const boardId = await ctx.db.insert("boards", {
      name: args.name,
      ownerId: identity.subject,
      repoId: args.repoId,
      createdAt: Date.now(),
    });
    const defaultColumns = [
      { name: "Backlog", order: 0, isRunColumn: false },
      { name: "In Progress", order: 1, isRunColumn: true },
      { name: "Done", order: 2, isRunColumn: false },
    ];
    for (const col of defaultColumns) {
      await ctx.db.insert("columns", {
        boardId,
        name: col.name,
        order: col.order,
        isRunColumn: col.isRunColumn,
      });
    }
    return boardId;
  },
});

export const update = mutation({
  args: {
    id: v.id("boards"),
    name: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const board = await ctx.db.get(args.id);
    if (!board || board.ownerId !== identity.subject) {
      throw new Error("Board not found");
    }
    await ctx.db.patch(args.id, { name: args.name });
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("boards") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const board = await ctx.db.get(args.id);
    if (!board || board.ownerId !== identity.subject) {
      throw new Error("Board not found");
    }
    const tasks = await ctx.db
      .query("agentTasks")
      .withIndex("by_board", (q) => q.eq("boardId", args.id))
      .collect();
    for (const task of tasks) {
      const runs = await ctx.db
        .query("agentRuns")
        .withIndex("by_task", (q) => q.eq("taskId", task._id))
        .collect();
      for (const run of runs) {
        await ctx.db.delete(run._id);
      }
      await ctx.db.delete(task._id);
    }
    const columns = await ctx.db
      .query("columns")
      .withIndex("by_board", (q) => q.eq("boardId", args.id))
      .collect();
    for (const col of columns) {
      await ctx.db.delete(col._id);
    }
    await ctx.db.delete(args.id);
    return null;
  },
});
