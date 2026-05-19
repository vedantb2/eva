import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { authQuery, hasRepoAccess } from "./functions";

/** Inserts a new log entry for a repo entity (internal use only). */
export const log = internalMutation({
  args: {
    entityType: v.string(),
    entityId: v.string(),
    entityTitle: v.string(),
    rawResultEvent: v.optional(v.string()),
    repoId: v.id("githubRepos"),
    projectId: v.optional(v.id("projects")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("logs", {
      entityType: args.entityType,
      entityId: args.entityId,
      entityTitle: args.entityTitle,
      rawResultEvent: args.rawResultEvent,
      repoId: args.repoId,
      projectId: args.projectId,
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
      projectId: v.optional(v.id("projects")),
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
      projectId: entry.projectId,
      createdAt: entry.createdAt,
    }));
  },
});

/** Gets all log entries that belong to a project. Covers project chats and
 *  any project-scoped tasks (quickTask, task-chat, audits) tagged with this
 *  projectId, so callers can aggregate the project's full usage. */
export const getByProjectId = authQuery({
  args: {
    repoId: v.id("githubRepos"),
    projectId: v.id("projects"),
  },
  returns: v.array(
    v.object({
      _id: v.id("logs"),
      entityType: v.string(),
      entityId: v.string(),
      entityTitle: v.string(),
      rawResultEvent: v.optional(v.string()),
      projectId: v.optional(v.id("projects")),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) {
      return [];
    }
    // Confirm the project lives in the repo the caller is asking about — the
    // by_project index alone would otherwise leak logs across repos.
    const project = await ctx.db.get(args.projectId);
    if (!project || project.repoId !== args.repoId) {
      return [];
    }

    const logs = await ctx.db
      .query("logs")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .order("desc")
      .collect();

    return logs.map((entry) => ({
      _id: entry._id,
      entityType: entry.entityType,
      entityId: entry.entityId,
      entityTitle: entry.entityTitle,
      rawResultEvent: entry.rawResultEvent,
      projectId: entry.projectId,
      createdAt: entry.createdAt,
    }));
  },
});

/** Lists log entries for a repo, optionally filtered by start time. */
export const listByRepo = authQuery({
  args: {
    repoId: v.id("githubRepos"),
    startTime: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("logs"),
      entityType: v.string(),
      entityId: v.string(),
      entityTitle: v.string(),
      rawResultEvent: v.optional(v.string()),
      projectId: v.optional(v.id("projects")),
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

    return all.map((entry) => ({
      _id: entry._id,
      entityType: entry.entityType,
      entityId: entry.entityId,
      entityTitle: entry.entityTitle,
      rawResultEvent: entry.rawResultEvent,
      projectId: entry.projectId,
      createdAt: entry.createdAt,
    }));
  },
});

/** Lists log entries grouped by project for a repo. Returns project metadata
 *  alongside an aggregated cost total so the UI can show per-project spending. */
export const listByProject = authQuery({
  args: {
    repoId: v.id("githubRepos"),
    startTime: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      projectId: v.id("projects"),
      projectTitle: v.string(),
      logs: v.array(
        v.object({
          _id: v.id("logs"),
          entityType: v.string(),
          entityId: v.string(),
          entityTitle: v.string(),
          rawResultEvent: v.optional(v.string()),
          createdAt: v.number(),
        }),
      ),
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

    const projectIdSet = new Set<Id<"projects">>();
    for (const entry of all) {
      if (entry.projectId !== undefined) {
        projectIdSet.add(entry.projectId);
      }
    }

    const projectTitles = new Map<string, string>();
    for (const pid of projectIdSet) {
      const project = await ctx.db.get(pid);
      if (project) {
        projectTitles.set(String(pid), project.title);
      }
    }

    type LogEntry = {
      _id: Id<"logs">;
      entityType: string;
      entityId: string;
      entityTitle: string;
      rawResultEvent: string | undefined;
      createdAt: number;
    };

    const groups = new Map<
      string,
      { projectId: Id<"projects">; logs: LogEntry[] }
    >();

    for (const entry of all) {
      if (entry.projectId === undefined) continue;
      const pidStr = String(entry.projectId);
      if (!projectTitles.has(pidStr)) continue;
      const logEntry: LogEntry = {
        _id: entry._id,
        entityType: entry.entityType,
        entityId: entry.entityId,
        entityTitle: entry.entityTitle,
        rawResultEvent: entry.rawResultEvent,
        createdAt: entry.createdAt,
      };
      const existing = groups.get(pidStr);
      if (existing) {
        existing.logs.push(logEntry);
      } else {
        groups.set(pidStr, {
          projectId: entry.projectId,
          logs: [logEntry],
        });
      }
    }

    return Array.from(groups.values()).map((data) => ({
      projectId: data.projectId,
      projectTitle:
        projectTitles.get(String(data.projectId)) ?? "Unknown Project",
      logs: data.logs,
    }));
  },
});
