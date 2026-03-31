import { v } from "convex/values";
import { internalQuery } from "../_generated/server";
import { authQuery } from "../functions";
import { githubRepoValidator } from "./helpers";

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

export const get = authQuery({
  args: { id: v.id("githubRepos") },
  returns: v.union(githubRepoValidator, v.null()),
  handler: async (ctx, args) => {
    const repo = await ctx.db.get(args.id);
    if (!repo) return null;

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

export const getInternal = internalQuery({
  args: { id: v.id("githubRepos") },
  returns: v.union(githubRepoValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
