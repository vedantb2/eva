import { v } from "convex/values";
import { authQuery, authMutation } from "./functions";
import { internalQuery } from "./_generated/server";
import { resolveCanonicalRepoId } from "./_githubRepos/helpers";
import type { Id } from "./_generated/dataModel";

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
      disabledForAppIds: v.optional(v.array(v.id("githubRepos"))),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const canonicalId = await resolveCanonicalRepoId(ctx.db, args.repoId);
    return await ctx.db
      .query("auditCategories")
      .withIndex("by_repo", (q) => q.eq("repoId", canonicalId))
      .collect();
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

        if (isRepoLevel) {
          if (
            args.appId &&
            c.disabledForAppIds &&
            c.disabledForAppIds.includes(args.appId)
          ) {
            return false;
          }
          return true;
        }

        return isForThisApp;
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

export const toggleDisabledForApp = authMutation({
  args: {
    id: v.id("auditCategories"),
    appId: v.id("githubRepos"),
    disabled: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.id);
    if (!category) throw new Error("Category not found");
    if (category.appId !== undefined) {
      throw new Error(
        "Can only toggle app overrides for repo-level categories",
      );
    }

    const current: Array<Id<"githubRepos">> = category.disabledForAppIds ?? [];

    const updated = args.disabled
      ? [...new Set([...current, args.appId])]
      : current.filter((id) => id !== args.appId);

    await ctx.db.patch(args.id, { disabledForAppIds: updated });
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
