import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserId } from "./auth";

const featureValidator = v.object({
  _id: v.id("features"),
  _creationTime: v.number(),
  repoId: v.id("githubRepos"),
  userId: v.id("users"),
  planId: v.optional(v.id("plans")),
  title: v.string(),
  description: v.optional(v.string()),
  branchName: v.string(),
  status: v.union(
    v.literal("planning"),
    v.literal("active"),
    v.literal("completed"),
    v.literal("archived")
  ),
});

export const list = query({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(featureValidator),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return [];
    }
    return await ctx.db
      .query("features")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("features") },
  returns: v.union(featureValidator, v.null()),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return null;
    }
    return await ctx.db.get(args.id);
  },
});

export const getByPlan = query({
  args: { planId: v.id("plans") },
  returns: v.union(featureValidator, v.null()),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return null;
    }
    return await ctx.db
      .query("features")
      .withIndex("by_plan", (q) => q.eq("planId", args.planId))
      .first();
  },
});

export const create = mutation({
  args: {
    repoId: v.id("githubRepos"),
    planId: v.optional(v.id("plans")),
    title: v.string(),
    description: v.optional(v.string()),
    branchName: v.string(),
  },
  returns: v.id("features"),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    return await ctx.db.insert("features", {
      repoId: args.repoId,
      userId,
      planId: args.planId,
      title: args.title,
      description: args.description,
      branchName: args.branchName,
      status: "planning",
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("features"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("planning"),
        v.literal("active"),
        v.literal("completed"),
        v.literal("archived")
      )
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    const feature = await ctx.db.get(args.id);
    if (!feature) {
      throw new Error("Feature not found");
    }
    const updates: {
      title?: string;
      description?: string;
      status?: "planning" | "active" | "completed" | "archived";
    } = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.status !== undefined) updates.status = args.status;
    await ctx.db.patch(args.id, updates);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("features") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    const feature = await ctx.db.get(args.id);
    if (!feature) {
      throw new Error("Feature not found");
    }
    await ctx.db.delete(args.id);
    return null;
  },
});
