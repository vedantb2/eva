import { v } from "convex/values";
import { authQuery, authMutation, hasRepoAccess } from "./functions";

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

export const list = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(savedQueryValidator),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) return [];
    return await ctx.db
      .query("savedQueries")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
  },
});

export const get = authQuery({
  args: { id: v.id("savedQueries") },
  returns: v.union(savedQueryValidator, v.null()),
  handler: async (ctx, args) => {
    const sq = await ctx.db.get(args.id);
    if (!sq) return null;
    if (!(await hasRepoAccess(ctx.db, sq.repoId, ctx.userId))) return null;
    return sq;
  },
});

export const create = authMutation({
  args: {
    repoId: v.id("githubRepos"),
    title: v.string(),
    query: v.string(),
    researchQueryId: v.optional(v.id("researchQueries")),
  },
  returns: v.id("savedQueries"),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    const now = Date.now();
    return await ctx.db.insert("savedQueries", {
      repoId: args.repoId,
      userId: ctx.userId,
      researchQueryId: args.researchQueryId,
      title: args.title,
      query: args.query,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = authMutation({
  args: {
    id: v.id("savedQueries"),
    title: v.optional(v.string()),
    query: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Saved query not found");
    if (!(await hasRepoAccess(ctx.db, existing.repoId, ctx.userId)))
      throw new Error("Not authorized");
    const updates: { title?: string; query?: string; updatedAt: number } = {
      updatedAt: Date.now(),
    };
    if (args.title !== undefined) updates.title = args.title;
    if (args.query !== undefined) updates.query = args.query;
    await ctx.db.patch(args.id, updates);
    return null;
  },
});

export const remove = authMutation({
  args: { id: v.id("savedQueries") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.id);
    if (!existing) throw new Error("Saved query not found");
    if (!(await hasRepoAccess(ctx.db, existing.repoId, ctx.userId)))
      throw new Error("Not authorized");
    await ctx.db.delete(args.id);
    return null;
  },
});
