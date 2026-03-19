import { v } from "convex/values";
import { authQuery, authMutation } from "./functions";
import { internalQuery } from "./_generated/server";
import { resolveCanonicalRepoId } from "./_githubRepos/helpers";

export const listByRepo = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(
    v.object({
      _id: v.id("auditCategories"),
      _creationTime: v.number(),
      repoId: v.id("githubRepos"),
      name: v.string(),
      description: v.string(),
      enabled: v.boolean(),
      appId: v.optional(v.id("githubRepos")),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const canonicalId = await resolveCanonicalRepoId(ctx.db, args.repoId);
    const rows = await ctx.db
      .query("auditCategories")
      .withIndex("by_repo", (q) => q.eq("repoId", canonicalId))
      .collect();
    return rows.map((row) => ({
      _id: row._id,
      _creationTime: row._creationTime,
      repoId: row.repoId,
      name: row.name,
      description: row.description,
      enabled: row.enabled,
      appId: row.appId,
      createdAt: row.createdAt,
    }));
  },
});

export const hasEnabledCategories = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const canonicalId = await resolveCanonicalRepoId(ctx.db, args.repoId);
    const category = await ctx.db
      .query("auditCategories")
      .withIndex("by_repo", (q) => q.eq("repoId", canonicalId))
      .filter((q) => q.eq(q.field("enabled"), true))
      .first();
    return category !== null;
  },
});

export const listEnabledForContext = internalQuery({
  args: {
    repoId: v.id("githubRepos"),
    appId: v.optional(v.id("githubRepos")),
  },
  returns: v.array(
    v.object({
      name: v.string(),
      description: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const canonicalId = await resolveCanonicalRepoId(ctx.db, args.repoId);
    const categories = await ctx.db
      .query("auditCategories")
      .withIndex("by_repo", (q) => q.eq("repoId", canonicalId))
      .collect();

    return categories
      .filter((c) => {
        if (!c.enabled) return false;
        const isRepoLevel = c.appId === undefined;
        const isForThisApp = c.appId !== undefined && c.appId === args.appId;
        return isRepoLevel || isForThisApp;
      })
      .map((c) => ({ name: c.name, description: c.description }));
  },
});

export const create = authMutation({
  args: {
    repoId: v.id("githubRepos"),
    name: v.string(),
    description: v.string(),
    appId: v.optional(v.id("githubRepos")),
  },
  returns: v.id("auditCategories"),
  handler: async (ctx, args) => {
    const canonicalId = await resolveCanonicalRepoId(ctx.db, args.repoId);
    return await ctx.db.insert("auditCategories", {
      repoId: canonicalId,
      name: args.name,
      description: args.description,
      enabled: true,
      appId: args.appId,
      createdAt: Date.now(),
    });
  },
});

export const update = authMutation({
  args: {
    id: v.id("auditCategories"),
    name: v.string(),
    description: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.id);
    if (!category) throw new Error("Category not found");

    await ctx.db.patch(args.id, {
      name: args.name,
      description: args.description,
    });
    return null;
  },
});

export const toggleEnabled = authMutation({
  args: {
    id: v.id("auditCategories"),
    enabled: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.id);
    if (!category) throw new Error("Category not found");

    await ctx.db.patch(args.id, { enabled: args.enabled });
    return null;
  },
});

export const remove = authMutation({
  args: { id: v.id("auditCategories") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.id);
    if (!category) throw new Error("Category not found");

    await ctx.db.delete(args.id);
    return null;
  },
});
