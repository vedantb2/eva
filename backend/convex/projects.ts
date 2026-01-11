import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("projects"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.optional(v.string()),
      userId: v.string(),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    const userId = identity.subject;
    return await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("projects") },
  returns: v.union(
    v.object({
      _id: v.id("projects"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.optional(v.string()),
      userId: v.string(),
      createdAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    const project = await ctx.db.get(args.id);
    if (!project || project.userId !== identity.subject) {
      return null;
    }
    return project;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  returns: v.id("projects"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    return await ctx.db.insert("projects", {
      name: args.name,
      description: args.description,
      userId: identity.subject,
      createdAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const project = await ctx.db.get(args.id);
    if (!project || project.userId !== identity.subject) {
      throw new Error("Project not found");
    }
    const updates: { name?: string; description?: string } = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    await ctx.db.patch(args.id, updates);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const project = await ctx.db.get(args.id);
    if (!project || project.userId !== identity.subject) {
      throw new Error("Project not found");
    }
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.id))
      .collect();
    for (const task of tasks) {
      await ctx.db.delete(task._id);
    }
    await ctx.db.delete(args.id);
    return null;
  },
});
