import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { authQuery, hasRepoAccess } from "./functions";

/** Inserts a new log entry for a repo entity (internal use only). */
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

/** Gets all log entries for a specific entity (task, session, etc.). */
export const getByEntityId = authQuery({
  args: {
    repoId: v.id("githubRepos"),
    entityId: v.string(),
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

    const logs = await ctx.db
      .query("logs")
      .withIndex("by_repo_and_entity", (q) =>
        q.eq("repoId", args.repoId).eq("entityId", args.entityId),
      )
      .order("desc")
      .collect();

    return logs.map((entry) => ({
      _id: entry._id,
      entityType: entry.entityType,
      entityId: entry.entityId,
      entityTitle: entry.entityTitle,
      rawResultEvent: entry.rawResultEvent,
      createdAt: entry.createdAt,
    }));
  },
});

/** Lists log entries for a repo, optionally filtered by start time and entity types. */
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
      .withIndex("by_repo_and_created", (q) => {
        const base = q.eq("repoId", args.repoId);
        return args.startTime !== undefined
          ? base.gte("createdAt", args.startTime)
          : base;
      })
      .order("desc")
      .collect();

    const filtered =
      args.entityTypes !== undefined
        ? all.filter((entry) => args.entityTypes?.includes(entry.entityType))
        : all;

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
