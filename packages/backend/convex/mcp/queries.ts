import { internalQuery, type QueryCtx } from "../_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { listAutomationsForRepo } from "../_automations/helpers";
import { hasRepoAccess } from "../functions";
import { entityVisible } from "../numId";

/** Checks whether a user has access to a repo (via ownership or team membership). */
export const checkRepoAccessForUser = internalQuery({
  args: { repoId: v.string(), userId: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args): Promise<boolean> => {
    const repoId = ctx.db.normalizeId("githubRepos", args.repoId);
    const userId = ctx.db.normalizeId("users", args.userId);
    if (!repoId || !userId) return false;
    const repo = await ctx.db.get(repoId);
    if (!repo) return false;
    if (repo.connectedBy === args.userId) return true;
    const teamId = repo.teamId;
    if (!teamId) return false;
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", teamId).eq("userId", userId),
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

/**
 * A chat an MCP caller named, before any access check. The three surfaces are
 * separate tables, so the ref search yields a discriminated hit rather than a
 * common document type.
 */
type ChatTargetHit =
  | { kind: "session"; doc: Doc<"sessions"> }
  | { kind: "task"; doc: Doc<"agentTasks"> }
  | { kind: "project"; doc: Doc<"projects"> };

const chatTargetKindValidator = v.union(
  v.literal("session"),
  v.literal("task"),
  v.literal("project"),
);

/** Kinds to search, in the order a bare reference most likely means. */
const KIND_SEARCH_ORDER = ["session", "task", "project"] as const;

function kindsToSearch(
  kind: string | undefined,
): readonly ("session" | "task" | "project")[] {
  if (kind === undefined) return KIND_SEARCH_ORDER;
  return KIND_SEARCH_ORDER.filter((candidate) => candidate === kind);
}

/**
 * Loads a chat target by Convex id. A Convex id encodes its table, so
 * `normalizeId` rejects an id from another table outright — trying each kind
 * in turn is a lookup, not a guess.
 */
async function findById(
  ctx: QueryCtx,
  id: string,
  kinds: readonly ("session" | "task" | "project")[],
): Promise<ChatTargetHit | null> {
  for (const kind of kinds) {
    if (kind === "session") {
      const sessionId = ctx.db.normalizeId("sessions", id);
      const doc = sessionId ? await ctx.db.get(sessionId) : null;
      if (doc) return { kind, doc };
    } else if (kind === "task") {
      const taskId = ctx.db.normalizeId("agentTasks", id);
      const doc = taskId ? await ctx.db.get(taskId) : null;
      if (doc) return { kind, doc };
    } else {
      const projectId = ctx.db.normalizeId("projects", id);
      const doc = projectId ? await ctx.db.get(projectId) : null;
      if (doc) return { kind, doc };
    }
  }
  return null;
}

/**
 * Finds the chat that opened a pull request. Sessions and projects hold their
 * `prUrl` directly; a quick task's PR belongs to one of its runs, so that
 * lookup goes through `agentRuns` and hands back the owning task.
 */
async function findByPrUrl(
  ctx: QueryCtx,
  prUrl: string,
  kinds: readonly ("session" | "task" | "project")[],
): Promise<ChatTargetHit | null> {
  for (const kind of kinds) {
    if (kind === "session") {
      const doc = await ctx.db
        .query("sessions")
        .withIndex("by_pr_url", (q) => q.eq("prUrl", prUrl))
        .first();
      if (doc) return { kind, doc };
    } else if (kind === "task") {
      const run = await ctx.db
        .query("agentRuns")
        .withIndex("by_pr_url", (q) => q.eq("prUrl", prUrl))
        .first();
      const doc = run ? await ctx.db.get(run.taskId) : null;
      if (doc) return { kind, doc };
    } else {
      const doc = await ctx.db
        .query("projects")
        .withIndex("by_pr_url", (q) => q.eq("prUrl", prUrl))
        .first();
      if (doc) return { kind, doc };
    }
  }
  return null;
}

/**
 * Finds a chat by the number in its Eva url. A numId is unique only inside one
 * repo AND one kind (session 42 and task 42 both exist), so both must be
 * known: an unresolvable repo is a miss rather than a repo-wide scan.
 */
async function findByNumId(
  ctx: QueryCtx,
  numId: number,
  rawRepoId: string | undefined,
  kinds: readonly ("session" | "task" | "project")[],
): Promise<ChatTargetHit | null> {
  const repoId = rawRepoId
    ? ctx.db.normalizeId("githubRepos", rawRepoId)
    : null;
  if (!repoId || kinds.length !== 1) return null;
  const [kind] = kinds;

  if (kind === "session") {
    const doc = await ctx.db
      .query("sessions")
      .withIndex("by_repo_and_numId", (q) =>
        q.eq("repoId", repoId).eq("numId", numId),
      )
      .first();
    return doc ? { kind, doc } : null;
  }
  if (kind === "task") {
    const doc = await ctx.db
      .query("agentTasks")
      .withIndex("by_repo_and_numId", (q) =>
        q.eq("repoId", repoId).eq("numId", numId),
      )
      .first();
    return doc ? { kind, doc } : null;
  }
  const doc = await ctx.db
    .query("projects")
    .withIndex("by_repo_and_numId", (q) =>
      q.eq("repoId", repoId).eq("numId", numId),
    )
    .first();
  return doc ? { kind: "project", doc } : null;
}

/**
 * Finds the chat an MCP caller named, before any access check. One ref wins at
 * a time, in the order the caller is most likely to have been precise:
 * explicit id, then PR link, then the per-repo number from the url.
 */
async function findChatTargetByRef(
  ctx: QueryCtx,
  ref: {
    kind?: string;
    id?: string;
    prUrl?: string;
    numId?: number;
    repoId?: string;
  },
): Promise<ChatTargetHit | null> {
  const kinds = kindsToSearch(ref.kind);
  if (kinds.length === 0) return null;
  if (ref.id !== undefined) return await findById(ctx, ref.id, kinds);
  if (ref.prUrl !== undefined) return await findByPrUrl(ctx, ref.prUrl, kinds);
  if (ref.numId !== undefined) {
    return await findByNumId(ctx, ref.numId, ref.repoId, kinds);
  }
  return null;
}

/** The repo a hit belongs to. A task inherits its project's when it has none. */
async function targetRepoId(
  ctx: QueryCtx,
  hit: ChatTargetHit,
): Promise<Id<"githubRepos"> | null> {
  if (hit.kind === "session" || hit.kind === "project") return hit.doc.repoId;
  if (hit.doc.repoId) return hit.doc.repoId;
  if (hit.doc.projectId) {
    const project = await ctx.db.get(hit.doc.projectId);
    return project?.repoId ?? null;
  }
  return null;
}

/**
 * Resolves a chat the MCP user may act on — a session, a quick task's sandbox
 * chat, or a project's sandbox chat — by Convex id, GitHub PR url, or per-repo
 * numId. Returns null for "no such chat" AND for "exists but this user cannot
 * reach its repo" — the two are deliberately indistinguishable to the caller,
 * so a stranger's id leaks nothing.
 *
 * `prUrl` must already be canonical (see `mcp/sessionRef.ts`); the lookup is an
 * exact index match.
 */
export const resolveChatTargetForUser = internalQuery({
  args: {
    userId: v.string(),
    /** Restricts the search to one surface. Required alongside `numId`. */
    kind: v.optional(chatTargetKindValidator),
    id: v.optional(v.string()),
    numId: v.optional(v.number()),
    prUrl: v.optional(v.string()),
    repoId: v.optional(v.string()),
  },
  returns: v.union(
    v.null(),
    v.object({
      kind: chatTargetKindValidator,
      targetId: v.string(),
      numId: v.optional(v.number()),
      title: v.string(),
      status: v.string(),
      prUrl: v.optional(v.string()),
      branchName: v.optional(v.string()),
      repoId: v.id("githubRepos"),
      repoOwner: v.string(),
      repoName: v.string(),
      repoRootDirectory: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = ctx.db.normalizeId("users", args.userId);
    if (!userId) return null;

    const hit = await findChatTargetByRef(ctx, args);
    if (!hit || !entityVisible(hit.doc)) return null;

    const repoId = await targetRepoId(ctx, hit);
    if (!repoId) return null;
    if (!(await hasRepoAccess(ctx.db, repoId, userId))) return null;

    const repo = await ctx.db.get(repoId);
    if (!repo) return null;

    const doc = hit.doc;
    return {
      kind: hit.kind,
      targetId: doc._id,
      numId: doc.numId,
      title: doc.title,
      // A project tracks a phase where the other two track a status; both
      // answer the same "where is this up to" question for the caller.
      status: hit.kind === "project" ? hit.doc.phase : hit.doc.status,
      // Quick tasks keep their PR on the run that opened it, not on the task.
      prUrl: hit.kind === "task" ? undefined : hit.doc.prUrl,
      branchName: hit.kind === "task" ? undefined : hit.doc.branchName,
      repoId,
      repoOwner: repo.owner,
      repoName: repo.name,
      repoRootDirectory: repo.rootDirectory,
    };
  },
});

/** Env var key that holds a repo's Postgres read-replica connection string. */
const POSTGRES_REPLICA_ENV_KEY = "POSTGRES_READ_REPLICA_URL";

/**
 * Given a list of repo IDs, returns the subset that have a
 * POSTGRES_READ_REPLICA_URL env var configured at the repo or (inherited) team
 * level. Used by `list_repos` to advertise which repos support `postgres_query`.
 *
 * Checks key presence only — it never reads or decrypts the value, and team
 * lookups are memoised so a shared team is only queried once.
 */
export const reposWithPostgresReplica = internalQuery({
  args: { repoIds: v.array(v.string()) },
  returns: v.array(v.string()),
  handler: async (ctx, { repoIds }): Promise<string[]> => {
    const teamHasKey = new Map<string, boolean>();
    const matches: string[] = [];

    for (const rawId of repoIds) {
      // normalizeId turns the caller's string back into a typed Id (or null
      // for anything malformed) without an `as` cast.
      const repoId = ctx.db.normalizeId("githubRepos", rawId);
      if (!repoId) continue;

      const repoVars = await ctx.db
        .query("repoEnvVars")
        .withIndex("by_repo", (q) => q.eq("repoId", repoId))
        .first();
      if (repoVars?.vars.some((e) => e.key === POSTGRES_REPLICA_ENV_KEY)) {
        matches.push(rawId);
        continue;
      }

      const repo = await ctx.db.get(repoId);
      const teamId = repo?.teamId;
      if (!teamId) continue;

      let teamHas = teamHasKey.get(teamId);
      if (teamHas === undefined) {
        const teamVars = await ctx.db
          .query("teamEnvVars")
          .withIndex("by_team", (q) => q.eq("teamId", teamId))
          .first();
        teamHas =
          teamVars?.vars.some((e) => e.key === POSTGRES_REPLICA_ENV_KEY) ??
          false;
        teamHasKey.set(teamId, teamHas);
      }
      if (teamHas) matches.push(rawId);
    }

    return matches;
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
        tasks
          .map((t) => t.projectId)
          .filter((id): id is Id<"projects"> => id !== undefined),
      );
      const projects = await Promise.all(
        Array.from(projectIds)
          .slice(0, limit)
          .map((id) => ctx.db.get(id)),
      );
      return projects.filter(Boolean);
    }

    if (table === "automations" && repoId) {
      const automations = await listAutomationsForRepo(ctx.db, repoId);
      return automations.slice(0, limit);
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
    // Convex IDs are opaque strings; normalizeId turns the caller's string back
    // into a typed Id (or null) for each candidate table without an `as` cast.
    const taskId = ctx.db.normalizeId("agentTasks", id);
    if (taskId) {
      const task = await ctx.db.get(taskId);
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
    }

    const sessionId = ctx.db.normalizeId("sessions", id);
    if (sessionId) {
      const session = await ctx.db.get(sessionId);
      if (session) {
        const repo = await ctx.db.get(session.repoId);
        if (repo && repo.connectedBy === userId) {
          return session;
        }
      }
    }

    const repoId = ctx.db.normalizeId("githubRepos", id);
    if (repoId) {
      const repo = await ctx.db.get(repoId);
      if (repo && repo.connectedBy === userId) {
        return repo;
      }
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
