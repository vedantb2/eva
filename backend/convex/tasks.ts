import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const taskStatusValidator = v.union(
  v.literal("todo"),
  v.literal("in_progress"),
  v.literal("done")
);

const taskValidator = v.object({
  _id: v.id("tasks"),
  _creationTime: v.number(),
  projectId: v.id("projects"),
  title: v.string(),
  description: v.optional(v.string()),
  status: taskStatusValidator,
  order: v.number(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const listByProject = query({
  args: { projectId: v.id("projects") },
  returns: v.array(taskValidator),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== identity.subject) {
      return [];
    }
    return await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("tasks") },
  returns: v.union(taskValidator, v.null()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    const task = await ctx.db.get(args.id);
    if (!task) {
      return null;
    }
    const project = await ctx.db.get(task.projectId);
    if (!project || project.userId !== identity.subject) {
      return null;
    }
    return task;
  },
});

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.optional(taskStatusValidator),
  },
  returns: v.id("tasks"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const project = await ctx.db.get(args.projectId);
    if (!project || project.userId !== identity.subject) {
      throw new Error("Project not found");
    }
    const status = args.status ?? "todo";
    const existingTasks = await ctx.db
      .query("tasks")
      .withIndex("by_project_and_status", (q) =>
        q.eq("projectId", args.projectId).eq("status", status)
      )
      .collect();
    const maxOrder = existingTasks.reduce(
      (max, t) => Math.max(max, t.order),
      -1
    );
    const now = Date.now();
    return await ctx.db.insert("tasks", {
      projectId: args.projectId,
      title: args.title,
      description: args.description,
      status,
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
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
    const project = await ctx.db.get(task.projectId);
    if (!project || project.userId !== identity.subject) {
      throw new Error("Task not found");
    }
    const updates: { title?: string; description?: string; updatedAt: number } =
      { updatedAt: Date.now() };
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    await ctx.db.patch(args.id, updates);
    return null;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("tasks"),
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
    const project = await ctx.db.get(task.projectId);
    if (!project || project.userId !== identity.subject) {
      throw new Error("Task not found");
    }
    if (task.status === args.status) {
      return null;
    }
    const tasksInNewStatus = await ctx.db
      .query("tasks")
      .withIndex("by_project_and_status", (q) =>
        q.eq("projectId", task.projectId).eq("status", args.status)
      )
      .collect();
    const maxOrder = tasksInNewStatus.reduce(
      (max, t) => Math.max(max, t.order),
      -1
    );
    await ctx.db.patch(args.id, {
      status: args.status,
      order: maxOrder + 1,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const updateOrder = mutation({
  args: {
    id: v.id("tasks"),
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
    const project = await ctx.db.get(task.projectId);
    if (!project || project.userId !== identity.subject) {
      throw new Error("Task not found");
    }
    await ctx.db.patch(args.id, {
      order: args.order,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("tasks") },
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
    const project = await ctx.db.get(task.projectId);
    if (!project || project.userId !== identity.subject) {
      throw new Error("Task not found");
    }
    await ctx.db.delete(args.id);
    return null;
  },
});
