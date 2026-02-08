import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserId } from "./auth";

const routineValidator = v.object({
  _id: v.id("routines"),
  _creationTime: v.number(),
  repoId: v.id("githubRepos"),
  userId: v.id("users"),
  title: v.string(),
  description: v.optional(v.string()),
  query: v.string(),
  schedule: v.optional(v.string()),
  lastRunAt: v.optional(v.number()),
  enabled: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const list = query({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(routineValidator),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("routines")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("routines") },
  returns: v.union(routineValidator, v.null()),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    repoId: v.id("githubRepos"),
    title: v.string(),
    query: v.string(),
    description: v.optional(v.string()),
    schedule: v.optional(v.string()),
  },
  returns: v.id("routines"),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const now = Date.now();
    return await ctx.db.insert("routines", {
      repoId: args.repoId,
      userId,
      title: args.title,
      description: args.description,
      query: args.query,
      schedule: args.schedule,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("routines"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    query: v.optional(v.string()),
    schedule: v.optional(v.string()),
    enabled: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Routine not found");
    if (existing.userId !== userId) throw new Error("Not authorized");
    const updates: {
      title?: string;
      description?: string;
      query?: string;
      schedule?: string;
      enabled?: boolean;
      updatedAt: number;
    } = { updatedAt: Date.now() };
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.query !== undefined) updates.query = args.query;
    if (args.schedule !== undefined) updates.schedule = args.schedule;
    if (args.enabled !== undefined) updates.enabled = args.enabled;
    await ctx.db.patch(args.id, updates);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("routines") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Routine not found");
    if (existing.userId !== userId) throw new Error("Not authorized");
    await ctx.db.delete(args.id);
    return null;
  },
});
