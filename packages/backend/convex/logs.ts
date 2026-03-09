import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { authQuery, hasRepoAccess } from "./functions";

export const log = internalMutation({
  args: {
    entityType: v.string(),
    entityId: v.string(),
    entityTitle: v.string(),
    rawResultEvent: v.optional(v.string()),
    repoId: v.id("githubRepos"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("logs", {
      entityType: args.entityType,
      entityId: args.entityId,
      entityTitle: args.entityTitle,
      rawResultEvent: args.rawResultEvent,
      repoId: args.repoId,
      createdAt: Date.now(),
    });
    return null;
  },
});

export const listByRepo = authQuery({
  args: {
    repoId: v.id("githubRepos"),
    startTime: v.optional(v.number()),
    entityTypes: v.optional(v.array(v.string())),
  },
  returns: v.array(
    v.object({
      _id: v.id("logs"),
      entityType: v.string(),
      entityId: v.string(),
      entityTitle: v.string(),
      rawResultEvent: v.optional(v.string()),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) {
      return [];
    }

    const all = await ctx.db
      .query("logs")
      .withIndex("by_repo_and_created", (q) => q.eq("repoId", args.repoId))
      .order("desc")
      .collect();

    const filtered = all.filter((entry) => {
      if (args.startTime !== undefined && entry.createdAt < args.startTime) {
        return false;
      }
      if (
        args.entityTypes !== undefined &&
        !args.entityTypes.includes(entry.entityType)
      ) {
        return false;
      }
      return true;
    });

    return filtered.map((entry) => ({
      _id: entry._id,
      entityType: entry.entityType,
      entityId: entry.entityId,
      entityTitle: entry.entityTitle,
      rawResultEvent: entry.rawResultEvent,
      createdAt: entry.createdAt,
    }));
  },
});
