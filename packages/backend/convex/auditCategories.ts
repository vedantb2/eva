import { v } from "convex/values";
import { authQuery, authMutation } from "./functions";
import { internalQuery } from "./_generated/server";
import { resolveCanonicalRepoId } from "./_githubRepos/helpers";

/** Lists all audit categories for a repo (resolved to canonical repo for monorepos). */
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

/** Checks whether a repo has at least one enabled audit category. */
export const hasEnabledCategories = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const canonicalId = await resolveCanonicalRepoId(ctx.db, args.repoId);
    const category = await ctx.db
      .query("auditCategories")
      .withIndex("by_repo_and_enabled", (q) =>
        q.eq("repoId", canonicalId).eq("enabled", true),
      )
      .first();
    return category !== null;
  },
});

/** Lists enabled audit categories applicable to a repo/app context (internal use). */
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
    const enabledCategories = await ctx.db
      .query("auditCategories")
      .withIndex("by_repo_and_enabled", (q) =>
        q.eq("repoId", canonicalId).eq("enabled", true),
      )
      .collect();

    return enabledCategories
      .filter((c) => {
        const isRepoLevel = c.appId === undefined;
        const isForThisApp = c.appId !== undefined && c.appId === args.appId;
        return isRepoLevel || isForThisApp;
      })
      .map((c) => ({ name: c.name, description: c.description }));
  },
});

/** Creates a new audit category for a repo, optionally scoped to a specific app. */
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

/** Updates an audit category's name and description. */
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

/** Toggles the enabled state of an audit category. */
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

/** Deletes an audit category. */
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
