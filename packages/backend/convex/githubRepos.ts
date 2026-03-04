import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { authQuery, authMutation } from "./functions";
import type { Doc, Id } from "./_generated/dataModel";
import { hasRepoReferences, normalizePath } from "./repoUtils";
import { claudeModelValidator } from "./validators";

const githubRepoValidator = v.object({
  _id: v.id("githubRepos"),
  _creationTime: v.number(),
  owner: v.string(),
  name: v.string(),
  installationId: v.number(),
  githubId: v.optional(v.number()),
  connected: v.optional(v.boolean()),
  connectedBy: v.optional(v.id("users")),
  teamId: v.optional(v.id("teams")),
  rootDirectory: v.optional(v.string()),
  defaultBaseBranch: v.optional(v.string()),
  defaultModel: v.optional(claudeModelValidator),
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
    githubId: v.optional(v.number()),
    rootDirectory: v.optional(v.string()),
    teamId: v.optional(v.id("teams")),
  },
  returns: v.id("githubRepos"),
  handler: async (ctx, args) => {
    const normalizedRoot = args.rootDirectory
      ? normalizePath(args.rootDirectory)
      : undefined;

    if (args.githubId !== undefined) {
      const byGithubId = await ctx.db
        .query("githubRepos")
        .withIndex("by_github_id", (q) => q.eq("githubId", args.githubId))
        .collect();
      const match = byGithubId.find(
        (r) => (r.rootDirectory ?? undefined) === (normalizedRoot ?? undefined),
      );
      if (match) {
        if (match.owner !== args.owner || match.name !== args.name) {
          await ctx.db.patch(match._id, {
            owner: args.owner,
            name: args.name,
          });
          return match._id;
        }
        throw new Error("Repository already exists");
      }
    }

    const candidates = await ctx.db
      .query("githubRepos")
      .withIndex("by_owner_name", (q) =>
        q.eq("owner", args.owner).eq("name", args.name),
      )
      .collect();

    const duplicate = candidates.find(
      (r) => (r.rootDirectory ?? undefined) === (normalizedRoot ?? undefined),
    );
    if (duplicate) {
      if (args.githubId !== undefined && duplicate.githubId === undefined) {
        await ctx.db.patch(duplicate._id, { githubId: args.githubId });
      }
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

    if (normalizedRoot) {
      const rootEntry = candidates.find((r) => !r.rootDirectory);
      if (rootEntry) {
        await ctx.db.delete(rootEntry._id);
      }
    }

    return await ctx.db.insert("githubRepos", {
      owner: args.owner,
      name: args.name,
      installationId: args.installationId,
      githubId: args.githubId,
      connectedBy: ctx.userId,
      teamId,
      rootDirectory: normalizedRoot,
    });
  },
});

export const upsert = internalMutation({
  args: {
    owner: v.string(),
    name: v.string(),
    installationId: v.number(),
    githubId: v.optional(v.number()),
    teamId: v.optional(v.id("teams")),
    rootDirectory: v.optional(v.string()),
  },
  returns: v.id("githubRepos"),
  handler: async (ctx, args) => {
    const normalizedRoot = args.rootDirectory
      ? normalizePath(args.rootDirectory)
      : undefined;

    let existing: Doc<"githubRepos"> | undefined;

    if (args.githubId !== undefined) {
      const byGithubId = await ctx.db
        .query("githubRepos")
        .withIndex("by_github_id", (q) => q.eq("githubId", args.githubId))
        .collect();
      existing = byGithubId.find(
        (r) => (r.rootDirectory ?? undefined) === (normalizedRoot ?? undefined),
      );
    }

    if (!existing) {
      const byOwnerName = await ctx.db
        .query("githubRepos")
        .withIndex("by_owner_name", (q) =>
          q.eq("owner", args.owner).eq("name", args.name),
        )
        .collect();
      existing = byOwnerName.find(
        (r) => (r.rootDirectory ?? undefined) === (normalizedRoot ?? undefined),
      );
    }

    if (existing) {
      const updates: Record<string, string | number | boolean | Id<"teams">> = {
        connected: true,
      };
      if (args.teamId && !existing.teamId) {
        updates.teamId = args.teamId;
      }
      if (existing.owner !== args.owner) {
        updates.owner = args.owner;
      }
      if (existing.name !== args.name) {
        updates.name = args.name;
      }
      if (args.githubId !== undefined && existing.githubId === undefined) {
        updates.githubId = args.githubId;
      }
      await ctx.db.patch(existing._id, updates);
      return existing._id;
    }

    return await ctx.db.insert("githubRepos", {
      owner: args.owner,
      name: args.name,
      installationId: args.installationId,
      githubId: args.githubId,
      connected: true,
      teamId: args.teamId,
      rootDirectory: normalizedRoot,
    });
  },
});

export const syncConnectedStatus = internalMutation({
  args: { connectedIds: v.array(v.id("githubRepos")) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const connectedSet = new Set(args.connectedIds);
    const all = await ctx.db.query("githubRepos").collect();

    for (const repo of all) {
      const shouldBeConnected = connectedSet.has(repo._id);
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

export const cleanupStaleSubApps = internalMutation({
  args: {
    detectedApps: v.array(
      v.object({
        owner: v.string(),
        name: v.string(),
        paths: v.array(v.string()),
      }),
    ),
  },
  returns: v.object({ deletedCount: v.number() }),
  handler: async (ctx, args) => {
    let deletedCount = 0;

    for (const entry of args.detectedApps) {
      const normalizedPaths = new Set(
        entry.paths
          .map((p) => normalizePath(p))
          .filter((p): p is string => p !== undefined),
      );

      const rows = await ctx.db
        .query("githubRepos")
        .withIndex("by_owner_name", (q) =>
          q.eq("owner", entry.owner).eq("name", entry.name),
        )
        .collect();

      const subAppRows = rows.filter((r) => r.rootDirectory !== undefined);

      for (const row of subAppRows) {
        if (normalizedPaths.has(row.rootDirectory ?? "")) continue;
        if (row.connected === true) continue;
        if (row.connectedBy !== undefined) continue;

        const referenced = await hasRepoReferences(ctx, row._id);
        if (referenced) continue;

        await ctx.db.delete(row._id);
        deletedCount++;
      }
    }

    return { deletedCount };
  },
});

export const updateConfig = authMutation({
  args: {
    repoId: v.id("githubRepos"),
    defaultBaseBranch: v.optional(v.string()),
    defaultModel: v.optional(claudeModelValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const repo = await ctx.db.get(args.repoId);
    if (!repo) throw new Error("Repository not found");

    if (repo.connectedBy !== ctx.userId) {
      const teamId = repo.teamId;
      if (teamId) {
        const membership = await ctx.db
          .query("teamMembers")
          .withIndex("by_team_and_user", (q) =>
            q.eq("teamId", teamId).eq("userId", ctx.userId),
          )
          .first();
        if (!membership) throw new Error("Not authorized");
      } else {
        throw new Error("Not authorized");
      }
    }

    await ctx.db.patch(args.repoId, {
      defaultBaseBranch: args.defaultBaseBranch,
      defaultModel: args.defaultModel,
    });
    return null;
  },
});
