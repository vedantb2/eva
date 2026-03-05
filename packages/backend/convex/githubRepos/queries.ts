import { v } from "convex/values";
import { internalQuery } from "../_generated/server";
import { authQuery } from "../functions";
import { githubRepoValidator } from "./helpers";

export const list = authQuery({
  args: {},
  returns: v.array(githubRepoValidator),
  handler: async (ctx) => {
    const userTeamMemberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .collect();

    const userTeamIds = new Set(userTeamMemberships.map((m) => m.teamId));

    const allRepos = await ctx.db.query("githubRepos").collect();

    return allRepos.filter((repo) => {
      if (repo.connectedBy === ctx.userId) return true;
      if (repo.teamId && userTeamIds.has(repo.teamId)) return true;
      return false;
    });
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
      .withIndex("by_owner_name", (q) =>
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

    return repos;
  },
});

export const getInternal = internalQuery({
  args: { id: v.id("githubRepos") },
  returns: v.union(githubRepoValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
