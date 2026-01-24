import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserId } from "./auth";

const docValidator = v.object({
  _id: v.id("docs"),
  _creationTime: v.number(),
  repoId: v.id("githubRepos"),
  title: v.string(),
  content: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const list = query({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(docValidator),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return [];
    }
    return await ctx.db
      .query("docs")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("docs") },
  returns: v.union(docValidator, v.null()),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      return null;
    }
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    repoId: v.id("githubRepos"),
    title: v.string(),
    content: v.string(),
  },
  returns: v.id("docs"),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    const now = Date.now();
    return await ctx.db.insert("docs", {
      repoId: args.repoId,
      title: args.title,
      content: args.content,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("docs"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    const doc = await ctx.db.get(args.id);
    if (!doc) {
      throw new Error("Doc not found");
    }
    const updates: { title?: string; content?: string; updatedAt: number } = {
      updatedAt: Date.now(),
    };
    if (args.title !== undefined) updates.title = args.title;
    if (args.content !== undefined) updates.content = args.content;
    await ctx.db.patch(args.id, updates);
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("docs") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    const doc = await ctx.db.get(args.id);
    if (!doc) {
      throw new Error("Doc not found");
    }
    await ctx.db.delete(args.id);
    return null;
  },
});

export const getNoAuth = query({
  args: { id: v.id("docs") },
  returns: v.union(docValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
