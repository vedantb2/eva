import { v } from "convex/values";
import { internalQuery } from "../_generated/server";
import { authQuery } from "../functions";
import { githubRepoValidator } from "./helpers";
import { getAIProviderAvailability } from "../validators";

/** Lists all GitHub repos accessible to the current user across their teams. */
export const list = authQuery({
  args: {
    includeHidden: v.optional(v.boolean()),
  },
  returns: v.array(githubRepoValidator),
  handler: async (ctx, args) => {
    const userTeamMemberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .collect();

    const teamRepoResults = await Promise.all(
      userTeamMemberships.map((m) =>
        ctx.db
          .query("githubRepos")
          .withIndex("by_team", (q) => q.eq("teamId", m.teamId))
          .collect(),
      ),
    );

    const connectedRepos = await ctx.db
      .query("githubRepos")
      .withIndex("by_connected_by", (q) => q.eq("connectedBy", ctx.userId))
      .collect();

    const seen = new Set<string>();
    const repos = [];
    for (const repo of [...connectedRepos, ...teamRepoResults.flat()]) {
      if (seen.has(String(repo._id))) continue;
      seen.add(String(repo._id));
      if (!args.includeHidden && repo.hidden === true) continue;
      repos.push(repo);
    }
    return repos;
  },
});

/** Gets a single GitHub repo by ID if the current user has access. */
export const get = authQuery({
  args: { id: v.id("githubRepos") },
  returns: v.union(githubRepoValidator, v.null()),
  handler: async (ctx, args) => {
    const repo = await ctx.db.get(args.id);
    if (!repo) return null;
    if (repo.hidden === true) return null;

    if (repo.connectedBy === ctx.userId) return repo;

    const teamId = repo.teamId;
    if (teamId) {
      const membership = await ctx.db
        .query("teamMembers")
        .withIndex("by_team_and_user", (q) =>
          q.eq("teamId", teamId).eq("userId", ctx.userId),
        )
        .first();
      if (membership) return repo;
    }

    return null;
  },
});

/** Checks which AI providers (Claude, Codex) are available for a repo based on configured env vars. */
export const getProviderAvailability = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.object({
    claude: v.boolean(),
    codex: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const repo = await ctx.db.get(args.repoId);
    if (!repo) {
      return { claude: false, codex: false };
    }

    if (repo.connectedBy !== ctx.userId) {
      const teamId = repo.teamId;
      if (teamId) {
        const membership = await ctx.db
          .query("teamMembers")
          .withIndex("by_team_and_user", (q) =>
            q.eq("teamId", teamId).eq("userId", ctx.userId),
          )
          .first();
        if (!membership) {
          return { claude: false, codex: false };
        }
      } else {
        return { claude: false, codex: false };
      }
    }

    const repoEnvDoc = await ctx.db
      .query("repoEnvVars")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .first();
    const { teamId } = repo;
    const teamEnvDoc = teamId
      ? await ctx.db
          .query("teamEnvVars")
          .withIndex("by_team", (q) => q.eq("teamId", teamId))
          .first()
      : null;

    const keys = new Set<string>();
    for (const entry of teamEnvDoc?.vars ?? []) {
      keys.add(entry.key);
    }
    for (const entry of repoEnvDoc?.vars ?? []) {
      keys.add(entry.key);
    }

    return getAIProviderAvailability(keys);
  },
});

/** Finds a GitHub repo by owner, name, and optional app name. */
export const getByOwnerAndName = authQuery({
  args: {
    owner: v.string(),
    name: v.string(),
    appName: v.optional(v.string()),
  },
  returns: v.union(githubRepoValidator, v.null()),
  handler: async (ctx, args) => {
    const candidates = await ctx.db
      .query("githubRepos")
      .withIndex("by_owner_and_name", (q) =>
        q.eq("owner", args.owner).eq("name", args.name),
      )
      .collect();

    const repo = args.appName
      ? candidates.find(
          (r) => r.rootDirectory?.split("/").pop() === args.appName,
        )
      : candidates.find((r) => !r.rootDirectory);

    if (!repo) return null;
    if (repo.hidden === true) return null;

    if (repo.connectedBy === ctx.userId) return repo;

    const teamId = repo.teamId;
    if (teamId) {
      const membership = await ctx.db
        .query("teamMembers")
        .withIndex("by_team_and_user", (q) =>
          q.eq("teamId", teamId).eq("userId", ctx.userId),
        )
        .first();
      if (membership) return repo;
    }

    return null;
  },
});

/** Returns the team ID associated with a repo (internal use only). */
export const getTeamIdForRepo = internalQuery({
  args: { repoId: v.string() },
  returns: v.union(v.id("teams"), v.null()),
  handler: async (ctx, args) => {
    const normalizedId = ctx.db.normalizeId("githubRepos", args.repoId);
    if (!normalizedId) return null;

    const repo = await ctx.db.get(normalizedId);
    if (!repo) return null;

    return repo.teamId ?? null;
  },
});

/** Lists all non-hidden repos belonging to a specific team. */
export const listByTeam = authQuery({
  args: { teamId: v.id("teams") },
  returns: v.array(githubRepoValidator),
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", ctx.userId),
      )
      .first();

    if (!membership) return [];

    const repos = await ctx.db
      .query("githubRepos")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    return repos.filter((r) => r.hidden !== true);
  },
});

/** Lists sibling monorepo sub-apps for a given repo entry. */
export const listSiblingApps = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(
    v.object({
      _id: v.id("githubRepos"),
      appName: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const repo = await ctx.db.get(args.repoId);
    if (!repo) return [];

    const siblings = await ctx.db
      .query("githubRepos")
      .withIndex("by_owner_and_name", (q) =>
        q.eq("owner", repo.owner).eq("name", repo.name),
      )
      .collect();

    return siblings
      .filter((s) => s._id !== args.repoId && s.rootDirectory)
      .map((s) => ({
        _id: s._id,
        appName: s.rootDirectory?.split("/").pop() ?? "",
      }));
  },
});

/** Gets a GitHub repo by ID without access control (internal use only). */
export const getInternal = internalQuery({
  args: { id: v.id("githubRepos") },
  returns: v.union(githubRepoValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/** Lists all repos grouped by codebase (owner/name). Each codebase shows root repo + sub-apps. */
export const listGroupedByCodebase = authQuery({
  args: {},
  returns: v.array(
    v.object({
      /** Codebase identifier: "owner/name" */
      codebase: v.string(),
      /** Display name for the codebase */
      displayName: v.string(),
      /** Whether this codebase has multiple apps (monorepo) */
      isMonorepo: v.boolean(),
      /** Apps within this codebase */
      apps: v.array(
        v.object({
          _id: v.id("githubRepos"),
          /** App name (rootDirectory folder name) or repo name if root */
          appName: v.string(),
          /** Full root directory path, null for root repo */
          rootDirectory: v.union(v.string(), v.null()),
        }),
      ),
    }),
  ),
  handler: async (ctx) => {
    const userTeamMemberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .collect();

    const teamRepoResults = await Promise.all(
      userTeamMemberships.map((m) =>
        ctx.db
          .query("githubRepos")
          .withIndex("by_team", (q) => q.eq("teamId", m.teamId))
          .collect(),
      ),
    );

    const connectedRepos = await ctx.db
      .query("githubRepos")
      .withIndex("by_connected_by", (q) => q.eq("connectedBy", ctx.userId))
      .collect();

    const seen = new Set<string>();
    const repos = [];
    for (const repo of [...connectedRepos, ...teamRepoResults.flat()]) {
      if (seen.has(String(repo._id))) continue;
      seen.add(String(repo._id));
      if (repo.hidden === true) continue;
      repos.push(repo);
    }

    // Group by owner/name
    const codebaseMap = new Map<
      string,
      {
        owner: string;
        name: string;
        apps: Array<{
          _id: (typeof repos)[number]["_id"];
          appName: string;
          rootDirectory: string | null;
        }>;
      }
    >();

    for (const repo of repos) {
      const codebaseKey = `${repo.owner}/${repo.name}`;
      if (!codebaseMap.has(codebaseKey)) {
        codebaseMap.set(codebaseKey, {
          owner: repo.owner,
          name: repo.name,
          apps: [],
        });
      }

      const appName = repo.rootDirectory
        ? (repo.rootDirectory.split("/").pop() ?? repo.name)
        : repo.name;

      codebaseMap.get(codebaseKey)?.apps.push({
        _id: repo._id,
        appName,
        rootDirectory: repo.rootDirectory ?? null,
      });
    }

    // Convert to array and sort
    const result = Array.from(codebaseMap.entries()).map(
      ([codebase, { name, apps }]) => ({
        codebase,
        displayName: name,
        isMonorepo: apps.length > 1,
        apps: apps.sort((a, b) => {
          // Root repo first, then alphabetically by app name
          if (a.rootDirectory === null) return -1;
          if (b.rootDirectory === null) return 1;
          return a.appName.localeCompare(b.appName);
        }),
      }),
    );

    // Sort codebases alphabetically
    return result.sort((a, b) => a.displayName.localeCompare(b.displayName));
  },
});
