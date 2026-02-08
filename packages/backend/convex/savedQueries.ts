import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserId } from "./auth";

const savedQueryValidator = v.object({
  _id: v.id("savedQueries"),
  _creationTime: v.number(),
  repoId: v.id("githubRepos"),
  userId: v.id("users"),
  researchQueryId: v.optional(v.id("researchQueries")),
  title: v.string(),
  query: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const list = query({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(savedQueryValidator),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("savedQueries")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("savedQueries") },
  returns: v.union(savedQueryValidator, v.null()),
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
    researchQueryId: v.optional(v.id("researchQueries")),
  },
  returns: v.id("savedQueries"),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const now = Date.now();
    return await ctx.db.insert("savedQueries", {
      repoId: args.repoId,
      userId,
      researchQueryId: args.researchQueryId,
      title: args.title,
      query: args.query,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("savedQueries"),
    title: v.optional(v.string()),
    query: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Saved query not found");
    if (existing.userId !== userId) throw new Error("Not authorized");
    const updates: { title?: string; query?: string; updatedAt: number } = {
      updatedAt: Date.now(),
    };
    if (args.title !== undefined) updates.title = args.title;
    if (args.query !== undefined) updates.query = args.query;
    await ctx.db.patch(args.id, updates);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("savedQueries") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Saved query not found");
    if (existing.userId !== userId) throw new Error("Not authorized");
    await ctx.db.delete(args.id);
    return null;
  },
});
