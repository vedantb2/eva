import { internalQuery } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

/** Checks whether a user has access to a repo (via ownership or team membership). */
export const checkRepoAccessForUser = internalQuery({
  args: { repoId: v.string(), userId: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args): Promise<boolean> => {
    const repo = await ctx.db.get(args.repoId as Id<"githubRepos">);
    if (!repo) return false;
    if (repo.connectedBy === args.userId) return true;
    const teamId = repo.teamId;
    if (!teamId) return false;
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", teamId).eq("userId", args.userId as Id<"users">),
      )
      .first();
    return membership !== null;
  },
});

/** Get user by Clerk ID. */
export const getUserByClerkId = internalQuery({
  args: { clerkUserId: v.string() },
  handler: async (ctx, { clerkUserId }) => {
    return ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkUserId))
      .first();
  },
});

/** List repos accessible to a user. */
export const listUserRepos = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    // Get repos connected by this user
    const connectedRepos = await ctx.db
      .query("githubRepos")
      .withIndex("by_connected_by", (q) => q.eq("connectedBy", userId))
      .collect();

    // Get repos via team membership
    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const teamRepoResults = await Promise.all(
      memberships.map((m) =>
        ctx.db
          .query("githubRepos")
          .withIndex("by_team", (q) => q.eq("teamId", m.teamId))
          .collect(),
      ),
    );

    // Dedupe repos
    const seen = new Set<string>();
    const result: typeof connectedRepos = [];
    for (const repo of [...connectedRepos, ...teamRepoResults.flat()]) {
      if (seen.has(repo._id)) continue;
      seen.add(repo._id);
      result.push(repo);
    }
    return result;
  },
});

/** Query a table with access control. */
export const queryTable = internalQuery({
  args: {
    table: v.string(),
    repoId: v.optional(v.id("githubRepos")),
    userId: v.id("users"),
    limit: v.number(),
  },
  handler: async (ctx, { table, repoId, userId, limit }) => {
    // Type-safe table queries for known tables
    if (table === "agentTasks" && repoId) {
      const tasks = await ctx.db
        .query("agentTasks")
        .withIndex("by_repo", (q) => q.eq("repoId", repoId))
        .order("desc")
        .take(limit);
      return tasks;
    }

    if (table === "sessions" && repoId) {
      const sessions = await ctx.db
        .query("sessions")
        .withIndex("by_repo", (q) => q.eq("repoId", repoId))
        .order("desc")
        .take(limit);
      return sessions;
    }

    if (table === "projects" && repoId) {
      // Projects don't have direct repoId, they have tasks with repoId
      // Return projects that have tasks in this repo
      const tasks = await ctx.db
        .query("agentTasks")
        .withIndex("by_repo", (q) => q.eq("repoId", repoId))
        .collect();
      const projectIds = new Set(
        tasks.filter((t) => t.projectId).map((t) => t.projectId),
      );
      const projects = await Promise.all(
        Array.from(projectIds)
          .slice(0, limit)
          .map((id) => ctx.db.get(id as Id<"projects">)),
      );
      return projects.filter(Boolean);
    }

    if (table === "automations" && repoId) {
      const automations = await ctx.db
        .query("automations")
        .withIndex("by_repo", (q) => q.eq("repoId", repoId))
        .take(limit);
      return automations;
    }

    if (table === "messages") {
      // Messages require a parentId, return empty for general query
      return [];
    }

    if (table === "notifications") {
      const notifications = await ctx.db
        .query("notifications")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .order("desc")
        .take(limit);
      return notifications;
    }

    if (table === "teams") {
      const memberships = await ctx.db
        .query("teamMembers")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      const teams = await Promise.all(
        memberships.map((m) => ctx.db.get(m.teamId)),
      );
      return teams.filter(Boolean).slice(0, limit);
    }

    if (table === "githubRepos") {
      // Return user's accessible repos
      const connectedRepos = await ctx.db
        .query("githubRepos")
        .withIndex("by_connected_by", (q) => q.eq("connectedBy", userId))
        .take(limit);
      return connectedRepos;
    }

    // For other tables, return empty (access control)
    return [];
  },
});

/** Get a document by ID with access control. */
export const getDocument = internalQuery({
  args: {
    id: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, { id, userId }) => {
    // Try to get the document - Convex IDs are strings
    // We need to try different table types
    try {
      // Try agentTasks
      const task = await ctx.db.get(id as Id<"agentTasks">);
      if (task && task.repoId) {
        // Verify access via repo
        const hasAccess = await ctx.db
          .query("teamMembers")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .first();
        const repo = await ctx.db.get(task.repoId);
        if (repo && (repo.connectedBy === userId || hasAccess)) {
          return task;
        }
      }
    } catch {
      // Not a valid ID for this table
    }

    try {
      // Try sessions
      const session = await ctx.db.get(id as Id<"sessions">);
      if (session) {
        const repo = await ctx.db.get(session.repoId);
        if (repo && repo.connectedBy === userId) {
          return session;
        }
      }
    } catch {
      // Not a valid ID for this table
    }

    try {
      // Try githubRepos
      const repo = await ctx.db.get(id as Id<"githubRepos">);
      if (repo && repo.connectedBy === userId) {
        return repo;
      }
    } catch {
      // Not a valid ID for this table
    }

    return null;
  },
});

/** Count documents in a table. */
export const countTable = internalQuery({
  args: {
    table: v.string(),
    repoId: v.optional(v.id("githubRepos")),
    userId: v.id("users"),
  },
  handler: async (ctx, { table, repoId, userId }) => {
    if (table === "agentTasks" && repoId) {
      const tasks = await ctx.db
        .query("agentTasks")
        .withIndex("by_repo", (q) => q.eq("repoId", repoId))
        .collect();
      return tasks.length;
    }

    if (table === "sessions" && repoId) {
      const sessions = await ctx.db
        .query("sessions")
        .withIndex("by_repo", (q) => q.eq("repoId", repoId))
        .collect();
      return sessions.length;
    }

    if (table === "notifications") {
      const notifications = await ctx.db
        .query("notifications")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();
      return notifications.length;
    }

    return 0;
  },
});
