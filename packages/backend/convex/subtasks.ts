import { v } from "convex/values";
import { authQuery, authMutation, hasTaskAccess } from "./functions";

const subtaskValidator = v.object({
  _id: v.id("subtasks"),
  _creationTime: v.number(),
  parentTaskId: v.id("agentTasks"),
  title: v.string(),
  completed: v.boolean(),
  order: v.number(),
});

export const listByTask = authQuery({
  args: { parentTaskId: v.id("agentTasks") },
  returns: v.array(subtaskValidator),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.parentTaskId);
    if (!task || !(await hasTaskAccess(ctx.db, task, ctx.userId))) return [];
    const subtasks = await ctx.db
      .query("subtasks")
      .withIndex("by_parent", (q) => q.eq("parentTaskId", args.parentTaskId))
      .collect();
    return subtasks.sort((a, b) => a.order - b.order);
  },
});

export const markCompleted = authMutation({
  args: {
    parentTaskId: v.id("agentTasks"),
    completedIndices: v.array(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.parentTaskId);
    if (!task || !(await hasTaskAccess(ctx.db, task, ctx.userId)))
      throw new Error("Task not found");
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

export const create = authMutation({
  args: {
    parentTaskId: v.id("agentTasks"),
    title: v.string(),
  },
  returns: v.id("subtasks"),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.parentTaskId);
    if (!task || !(await hasTaskAccess(ctx.db, task, ctx.userId)))
      throw new Error("Task not found");
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

export const update = authMutation({
  args: {
    id: v.id("subtasks"),
    title: v.optional(v.string()),
    completed: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const subtask = await ctx.db.get(args.id);
    if (!subtask) throw new Error("Subtask not found");
    const task = await ctx.db.get(subtask.parentTaskId);
    if (!task || !(await hasTaskAccess(ctx.db, task, ctx.userId)))
      throw new Error("Subtask not found");
    const updates: { title?: string; completed?: boolean } = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.completed !== undefined) updates.completed = args.completed;
    await ctx.db.patch(args.id, updates);
    return null;
  },
});

export const remove = authMutation({
  args: { id: v.id("subtasks") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const subtask = await ctx.db.get(args.id);
    if (!subtask) {
      throw new Error("Subtask not found");
    }
    const task = await ctx.db.get(subtask.parentTaskId);
    if (!task || !(await hasTaskAccess(ctx.db, task, ctx.userId)))
      throw new Error("Subtask not found");
    await ctx.db.delete(args.id);
    return null;
  },
});

export const reorder = authMutation({
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
    for (const update of args.updates) {
      const subtask = await ctx.db.get(update.id);
      if (!subtask) {
        continue;
      }
      const task = await ctx.db.get(subtask.parentTaskId);
      if (!task || !(await hasTaskAccess(ctx.db, task, ctx.userId))) continue;
      await ctx.db.patch(update.id, { order: update.order });
    }
    return null;
  },
});
