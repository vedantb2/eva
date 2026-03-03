import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { authQuery, authMutation } from "./functions";

const githubRepoValidator = v.object({
  _id: v.id("githubRepos"),
  _creationTime: v.number(),
  owner: v.string(),
  name: v.string(),
  installationId: v.number(),
  connected: v.optional(v.boolean()),
  connectedBy: v.optional(v.id("users")),
  teamId: v.optional(v.id("teams")),
  rootDirectory: v.optional(v.string()),
});

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

export const assignToTeam = authMutation({
  args: {
    teamId: v.id("teams"),
    repoId: v.id("githubRepos"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", ctx.userId),
      )
      .first();

    if (!membership || membership.role !== "owner") {
      throw new Error("Only team owners can add repositories");
    }

    const repo = await ctx.db.get(args.repoId);
    if (!repo) {
      throw new Error("Repository not found");
    }

    if (repo.teamId === args.teamId) {
      throw new Error("Repository is already assigned to this team");
    }

    await ctx.db.patch(args.repoId, { teamId: args.teamId });
    return null;
  },
});

export const removeFromTeam = authMutation({
  args: {
    teamId: v.id("teams"),
    repoId: v.id("githubRepos"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team_and_user", (q) =>
        q.eq("teamId", args.teamId).eq("userId", ctx.userId),
      )
      .first();

    if (!membership || membership.role !== "owner") {
      throw new Error("Only team owners can remove repositories");
    }

    const repo = await ctx.db.get(args.repoId);
    if (!repo) {
      throw new Error("Repository not found");
    }

    if (repo.teamId !== args.teamId) {
      throw new Error("Repository is not part of this team");
    }

    await ctx.db.patch(args.repoId, { teamId: undefined });
    return null;
  },
});

export const create = authMutation({
  args: {
    owner: v.string(),
    name: v.string(),
    installationId: v.number(),
    rootDirectory: v.optional(v.string()),
    teamId: v.optional(v.id("teams")),
  },
  returns: v.id("githubRepos"),
  handler: async (ctx, args) => {
    const candidates = await ctx.db
      .query("githubRepos")
      .withIndex("by_owner_name", (q) =>
        q.eq("owner", args.owner).eq("name", args.name),
      )
      .collect();

    const rootDir = args.rootDirectory ?? "";
    const duplicate = candidates.find(
      (r) => (r.rootDirectory ?? "") === rootDir,
    );
    if (duplicate) {
      throw new Error("Repository already exists");
    }

    let teamId = args.teamId;
    if (!teamId) {
      const teams = await ctx.db
        .query("teams")
        .withIndex("by_created_by", (q) => q.eq("createdBy", ctx.userId))
        .collect();
      const personalTeam = teams.find((t) => t.isPersonal === true);
      teamId = personalTeam?._id;
    }

    if (args.rootDirectory) {
      const rootEntry = candidates.find((r) => !r.rootDirectory);
      if (rootEntry) {
        await ctx.db.delete(rootEntry._id);
      }
    }

    return await ctx.db.insert("githubRepos", {
      owner: args.owner,
      name: args.name,
      installationId: args.installationId,
      connectedBy: ctx.userId,
      teamId,
      rootDirectory: args.rootDirectory,
    });
  },
});

export const remove = authMutation({
  args: { id: v.id("githubRepos") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const repo = await ctx.db.get(args.id);
    if (!repo) {
      throw new Error("Repository not found");
    }
    await ctx.db.delete(args.id);
    return null;
  },
});

export const upsert = internalMutation({
  args: {
    owner: v.string(),
    name: v.string(),
    installationId: v.number(),
    teamId: v.optional(v.id("teams")),
    rootDirectory: v.optional(v.string()),
  },
  returns: v.id("githubRepos"),
  handler: async (ctx, args) => {
    const candidates = await ctx.db
      .query("githubRepos")
      .withIndex("by_owner_name", (q) =>
        q.eq("owner", args.owner).eq("name", args.name),
      )
      .collect();

    const rootDir = args.rootDirectory ?? "";
    const existing = candidates.find(
      (r) => (r.rootDirectory ?? "") === rootDir,
    );

    if (existing) {
      const updates: { connected: boolean; teamId?: typeof args.teamId } = {
        connected: true,
      };
      if (args.teamId && !existing.teamId) {
        updates.teamId = args.teamId;
      }
      await ctx.db.patch(existing._id, updates);
      return existing._id;
    }
    return await ctx.db.insert("githubRepos", {
      owner: args.owner,
      name: args.name,
      installationId: args.installationId,
      connected: true,
      teamId: args.teamId,
      rootDirectory: args.rootDirectory,
    });
  },
});

export const syncConnectedStatus = internalMutation({
  args: { connectedIds: v.array(v.id("githubRepos")) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const connectedSet = new Set(args.connectedIds);
    const all = await ctx.db.query("githubRepos").collect();

    const connectedParents = new Set(
      all
        .filter((r) => connectedSet.has(r._id) && !r.rootDirectory)
        .map((r) => `${r.owner}/${r.name}`),
    );

    for (const repo of all) {
      const shouldBeConnected =
        connectedSet.has(repo._id) ||
        (repo.rootDirectory !== undefined &&
          connectedParents.has(`${repo.owner}/${repo.name}`));
      if (repo.connected !== shouldBeConnected) {
        await ctx.db.patch(repo._id, { connected: shouldBeConnected });
      }
    }
    return null;
  },
});

export const getInternal = internalQuery({
  args: { id: v.id("githubRepos") },
  returns: v.union(githubRepoValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const deleteInternal = internalMutation({
  args: { id: v.id("githubRepos") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const repo = await ctx.db.get(args.id);
    if (repo) {
      await ctx.db.delete(args.id);
    }
    return null;
  },
});
