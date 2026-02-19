import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
import { getCurrentUserId } from "./auth";

export const list = query({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(v.object({ key: v.string(), value: v.string() })),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) return [];
    const doc = await ctx.db
      .query("repoEnvVars")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .first();
    if (!doc) return [];
    return doc.vars;
  },
});

export const getForSandbox = internalQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(v.object({ key: v.string(), value: v.string() })),
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("repoEnvVars")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .first();
    if (!doc) return [];
    return doc.vars;
  },
});

export const upsertVar = mutation({
  args: {
    repoId: v.id("githubRepos"),
    key: v.string(),
    value: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const doc = await ctx.db
      .query("repoEnvVars")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .first();
    if (doc) {
      const vars = doc.vars.filter((v) => v.key !== args.key);
      vars.push({ key: args.key, value: args.value });
      await ctx.db.patch(doc._id, { vars, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("repoEnvVars", {
        repoId: args.repoId,
        vars: [{ key: args.key, value: args.value }],
        updatedAt: Date.now(),
      });
    }
    return null;
  },
});

export const removeVar = mutation({
  args: {
    repoId: v.id("githubRepos"),
    key: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const doc = await ctx.db
      .query("repoEnvVars")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .first();
    if (!doc) return null;
    const vars = doc.vars.filter((v) => v.key !== args.key);
    await ctx.db.patch(doc._id, { vars, updatedAt: Date.now() });
    return null;
  },
});
