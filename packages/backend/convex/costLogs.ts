import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { authQuery, hasRepoAccess } from "./functions";

export const log = internalMutation({
  args: {
    entityType: v.string(),
    entityId: v.string(),
    entityTitle: v.string(),
    costUsd: v.number(),
    model: v.string(),
    repoId: v.id("githubRepos"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("costLogs", {
      entityType: args.entityType,
      entityId: args.entityId,
      entityTitle: args.entityTitle,
      costUsd: args.costUsd,
      model: args.model,
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
    entityType: v.optional(v.string()),
  },
  returns: v.array(
    v.object({
      _id: v.id("costLogs"),
      entityType: v.string(),
      entityId: v.string(),
      entityTitle: v.string(),
      costUsd: v.number(),
      model: v.string(),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) {
      return [];
    }

    const logs = await ctx.db
      .query("costLogs")
      .withIndex("by_repo_and_created", (q) => q.eq("repoId", args.repoId))
      .order("desc")
      .collect();

    const filtered = logs.filter((log) => {
      if (args.startTime !== undefined && log.createdAt < args.startTime) {
        return false;
      }
      if (args.entityType !== undefined && log.entityType !== args.entityType) {
        return false;
      }
      return true;
    });

    return filtered.map((log) => ({
      _id: log._id,
      entityType: log.entityType,
      entityId: log.entityId,
      entityTitle: log.entityTitle,
      costUsd: log.costUsd,
      model: log.model,
      createdAt: log.createdAt,
    }));
  },
});
