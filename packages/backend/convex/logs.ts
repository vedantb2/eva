import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
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

const logWithProjectValidator = v.object({
  _id: v.id("logs"),
  entityType: v.string(),
  entityId: v.string(),
  entityTitle: v.string(),
  rawResultEvent: v.optional(v.string()),
  createdAt: v.number(),
  projectId: v.optional(v.id("projects")),
  projectTitle: v.optional(v.string()),
});

/** Lists log entries for a repo enriched with project info for task-related logs. */
export const listByRepoWithProjects = authQuery({
  args: {
    repoId: v.id("githubRepos"),
    startTime: v.optional(v.number()),
    entityTypes: v.optional(v.array(v.string())),
  },
  returns: v.array(logWithProjectValidator),
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

    const taskEntityTypes = new Set(["quickTask", "taskAudit", "task-chat"]);
    const projectEntityTypes = new Set(["project", "project-chat"]);

    const taskIds = new Set<string>();
    const projectIds = new Set<string>();
    for (const entry of filtered) {
      if (taskEntityTypes.has(entry.entityType)) {
        taskIds.add(entry.entityId);
      } else if (projectEntityTypes.has(entry.entityType)) {
        projectIds.add(entry.entityId);
      }
    }

    const taskProjectMap = new Map<
      string,
      { projectId: Id<"projects">; projectTitle: string }
    >();

    const taskIdArr = [...taskIds];
    const taskDocs = await Promise.all(
      taskIdArr.map((id) => {
        const normalized = ctx.db.normalizeId("agentTasks", id);
        return normalized ? ctx.db.get(normalized) : Promise.resolve(null);
      }),
    );
    const neededProjectIds = new Set<string>();
    for (const task of taskDocs) {
      if (task?.projectId) {
        neededProjectIds.add(String(task.projectId));
      }
    }
    for (const pid of projectIds) {
      neededProjectIds.add(pid);
    }

    const projectDocs = await Promise.all(
      [...neededProjectIds].map((id) => {
        const normalized = ctx.db.normalizeId("projects", id);
        return normalized ? ctx.db.get(normalized) : Promise.resolve(null);
      }),
    );
    const projectMap = new Map<string, { id: Id<"projects">; title: string }>();
    for (const proj of projectDocs) {
      if (proj) {
        projectMap.set(String(proj._id), { id: proj._id, title: proj.title });
      }
    }

    for (let i = 0; i < taskDocs.length; i++) {
      const task = taskDocs[i];
      if (task?.projectId) {
        const proj = projectMap.get(String(task.projectId));
        if (proj) {
          taskProjectMap.set(taskIdArr[i], {
            projectId: proj.id,
            projectTitle: proj.title,
          });
        }
      }
    }

    return filtered.map((entry) => {
      const taskProject = taskProjectMap.get(entry.entityId);
      if (taskProject) {
        return {
          _id: entry._id,
          entityType: entry.entityType,
          entityId: entry.entityId,
          entityTitle: entry.entityTitle,
          rawResultEvent: entry.rawResultEvent,
          createdAt: entry.createdAt,
          projectId: taskProject.projectId,
          projectTitle: taskProject.projectTitle,
        };
      }

      if (projectEntityTypes.has(entry.entityType)) {
        const proj = projectMap.get(entry.entityId);
        if (proj) {
          return {
            _id: entry._id,
            entityType: entry.entityType,
            entityId: entry.entityId,
            entityTitle: entry.entityTitle,
            rawResultEvent: entry.rawResultEvent,
            createdAt: entry.createdAt,
            projectId: proj.id,
            projectTitle: proj.title,
          };
        }
      }

      return {
        _id: entry._id,
        entityType: entry.entityType,
        entityId: entry.entityId,
        entityTitle: entry.entityTitle,
        rawResultEvent: entry.rawResultEvent,
        createdAt: entry.createdAt,
        projectId: undefined,
        projectTitle: undefined,
      };
    });
  },
});
