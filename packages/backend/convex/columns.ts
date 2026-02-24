import { v } from "convex/values";
import { authQuery, authMutation } from "./functions";

const columnValidator = v.object({
  _id: v.id("columns"),
  _creationTime: v.number(),
  boardId: v.id("boards"),
  name: v.string(),
  order: v.number(),
  isRunColumn: v.optional(v.boolean()),
});

export const listByBoard = authQuery({
  args: { boardId: v.id("boards") },
  returns: v.array(columnValidator),
  handler: async (ctx, args) => {
    const board = await ctx.db.get(args.boardId);
    if (!board || board.ownerId !== ctx.userId) {
      return [];
    }
    const columns = await ctx.db
      .query("columns")
      .withIndex("by_board", (q) => q.eq("boardId", args.boardId))
      .collect();
    return columns.sort((a, b) => a.order - b.order);
  },
});

export const create = authMutation({
  args: {
    boardId: v.id("boards"),
    name: v.string(),
  },
  returns: v.id("columns"),
  handler: async (ctx, args) => {
    const board = await ctx.db.get(args.boardId);
    if (!board || board.ownerId !== ctx.userId) {
      throw new Error("Board not found");
    }
    const columns = await ctx.db
      .query("columns")
      .withIndex("by_board", (q) => q.eq("boardId", args.boardId))
      .collect();
    const maxOrder = columns.reduce((max, col) => Math.max(max, col.order), -1);
    return await ctx.db.insert("columns", {
      boardId: args.boardId,
      name: args.name,
      order: maxOrder + 1,
      isRunColumn: false,
    });
  },
});

export const update = authMutation({
  args: {
    id: v.id("columns"),
    name: v.optional(v.string()),
    isRunColumn: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const column = await ctx.db.get(args.id);
    if (!column) {
      throw new Error("Column not found");
    }
    const board = await ctx.db.get(column.boardId);
    if (!board || board.ownerId !== ctx.userId) {
      throw new Error("Column not found");
    }
    if (args.isRunColumn === true) {
      const columns = await ctx.db
        .query("columns")
        .withIndex("by_board", (q) => q.eq("boardId", column.boardId))
        .collect();
      for (const col of columns) {
        if (col._id !== args.id && col.isRunColumn) {
          await ctx.db.patch(col._id, { isRunColumn: false });
        }
      }
    }
    const updates: { name?: string; isRunColumn?: boolean } = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.isRunColumn !== undefined) updates.isRunColumn = args.isRunColumn;
    await ctx.db.patch(args.id, updates);
    return null;
  },
});

export const reorder = authMutation({
  args: {
    id: v.id("columns"),
    newOrder: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const column = await ctx.db.get(args.id);
    if (!column) {
      throw new Error("Column not found");
    }
    const board = await ctx.db.get(column.boardId);
    if (!board || board.ownerId !== ctx.userId) {
      throw new Error("Column not found");
    }
    const oldOrder = column.order;
    if (oldOrder === args.newOrder) {
      return null;
    }
    const columns = await ctx.db
      .query("columns")
      .withIndex("by_board", (q) => q.eq("boardId", column.boardId))
      .collect();
    for (const col of columns) {
      if (col._id === args.id) continue;
      if (oldOrder < args.newOrder) {
        if (col.order > oldOrder && col.order <= args.newOrder) {
          await ctx.db.patch(col._id, { order: col.order - 1 });
        }
      } else {
        if (col.order >= args.newOrder && col.order < oldOrder) {
          await ctx.db.patch(col._id, { order: col.order + 1 });
        }
      }
    }
    await ctx.db.patch(args.id, { order: args.newOrder });
    return null;
  },
});

export const remove = authMutation({
  args: { id: v.id("columns") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const column = await ctx.db.get(args.id);
    if (!column) {
      throw new Error("Column not found");
    }
    const board = await ctx.db.get(column.boardId);
    if (!board || board.ownerId !== ctx.userId) {
      throw new Error("Column not found");
    }
    const tasks = await ctx.db
      .query("agentTasks")
      .withIndex("by_column", (q) => q.eq("columnId", args.id))
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
      .withIndex("by_board", (q) => q.eq("boardId", column.boardId))
      .collect();
    for (const col of columns) {
      if (col.order > column.order) {
        await ctx.db.patch(col._id, { order: col.order - 1 });
      }
    }
    await ctx.db.delete(args.id);
    return null;
  },
});
