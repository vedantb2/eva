import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { v } from "convex/values";

const subtaskValidator = v.object({
  _id: v.id("subtasks"),
  _creationTime: v.number(),
  parentTaskId: v.id("agentTasks"),
  title: v.string(),
  completed: v.boolean(),
  order: v.number(),
});

export const listByTask = query({
  args: { parentTaskId: v.id("agentTasks") },
  returns: v.array(subtaskValidator),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const task = await ctx.db.get(args.parentTaskId);
    if (!task) {
      return [];
    }
    const board = await ctx.db.get(task.boardId);
    if (!board || board.ownerId !== identity.subject) {
      return [];
    }
    const subtasks = await ctx.db
      .query("subtasks")
      .withIndex("by_parent", (q) => q.eq("parentTaskId", args.parentTaskId))
      .collect();
    return subtasks.sort((a, b) => a.order - b.order);
  },
});

export const markCompleted = mutation({
  args: {
    parentTaskId: v.id("agentTasks"),
    completedIndices: v.array(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const subtasks = await ctx.db
      .query("subtasks")
      .withIndex("by_parent", (q) => q.eq("parentTaskId", args.parentTaskId))
      .collect();
    const sorted = subtasks.sort((a, b) => a.order - b.order);
    for (const index of args.completedIndices) {
      if (index >= 0 && index < sorted.length) {
        await ctx.db.patch(sorted[index]._id, { completed: true });
      }
    }
    return null;
  },
});

export const listByTaskInternal = internalQuery({
  args: { parentTaskId: v.id("agentTasks") },
  returns: v.array(subtaskValidator),
  handler: async (ctx, args) => {
    const subtasks = await ctx.db
      .query("subtasks")
      .withIndex("by_parent", (q) => q.eq("parentTaskId", args.parentTaskId))
      .collect();
    return subtasks.sort((a, b) => a.order - b.order);
  },
});

export const markCompletedInternal = internalMutation({
  args: {
    parentTaskId: v.id("agentTasks"),
    completedIndices: v.array(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const subtasks = await ctx.db
      .query("subtasks")
      .withIndex("by_parent", (q) => q.eq("parentTaskId", args.parentTaskId))
      .collect();
    const sorted = subtasks.sort((a, b) => a.order - b.order);
    for (const index of args.completedIndices) {
      if (index >= 0 && index < sorted.length) {
        await ctx.db.patch(sorted[index]._id, { completed: true });
      }
    }
    return null;
  },
});

export const create = mutation({
  args: {
    parentTaskId: v.id("agentTasks"),
    title: v.string(),
  },
  returns: v.id("subtasks"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const task = await ctx.db.get(args.parentTaskId);
    if (!task) {
      throw new Error("Task not found");
    }
    const board = await ctx.db.get(task.boardId);
    if (!board || board.ownerId !== identity.subject) {
      throw new Error("Task not found");
    }
    const subtasks = await ctx.db
      .query("subtasks")
      .withIndex("by_parent", (q) => q.eq("parentTaskId", args.parentTaskId))
      .collect();
    const maxOrder = subtasks.reduce((max, s) => Math.max(max, s.order), -1);
    return await ctx.db.insert("subtasks", {
      parentTaskId: args.parentTaskId,
      title: args.title,
      completed: false,
      order: maxOrder + 1,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("subtasks"),
    title: v.optional(v.string()),
    completed: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const subtask = await ctx.db.get(args.id);
    if (!subtask) {
      throw new Error("Subtask not found");
    }
    const task = await ctx.db.get(subtask.parentTaskId);
    if (!task) {
      throw new Error("Task not found");
    }
    const board = await ctx.db.get(task.boardId);
    if (!board || board.ownerId !== identity.subject) {
      throw new Error("Subtask not found");
    }
    const updates: { title?: string; completed?: boolean } = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.completed !== undefined) updates.completed = args.completed;
    await ctx.db.patch(args.id, updates);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("subtasks") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const subtask = await ctx.db.get(args.id);
    if (!subtask) {
      throw new Error("Subtask not found");
    }
    const task = await ctx.db.get(subtask.parentTaskId);
    if (!task) {
      throw new Error("Task not found");
    }
    const board = await ctx.db.get(task.boardId);
    if (!board || board.ownerId !== identity.subject) {
      throw new Error("Subtask not found");
    }
    await ctx.db.delete(args.id);
    return null;
  },
});

export const reorder = mutation({
  args: {
    updates: v.array(
      v.object({
        id: v.id("subtasks"),
        order: v.number(),
      }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    for (const update of args.updates) {
      const subtask = await ctx.db.get(update.id);
      if (!subtask) {
        continue;
      }
      const task = await ctx.db.get(subtask.parentTaskId);
      if (!task) {
        continue;
      }
      const board = await ctx.db.get(task.boardId);
      if (!board || board.ownerId !== identity.subject) {
        continue;
      }
      await ctx.db.patch(update.id, { order: update.order });
    }
    return null;
  },
});
