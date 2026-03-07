import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { authMutation } from "../functions";
import { normalizePath } from "../repoUtils";
import { claudeModelValidator } from "../validators";

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
      defaultBaseBranch: "main",
    });
  },
});

export const updateConfig = authMutation({
  args: {
    repoId: v.id("githubRepos"),
    defaultBaseBranch: v.optional(v.string()),
    defaultModel: v.optional(claudeModelValidator),
    postAuditEnabled: v.optional(v.boolean()),
    accessibilityAuditEnabled: v.optional(v.boolean()),
    codeTestingAuditEnabled: v.optional(v.boolean()),
    codeReviewAuditEnabled: v.optional(v.boolean()),
    sessionsVncEnabled: v.optional(v.boolean()),
    sessionsVscodeEnabled: v.optional(v.boolean()),
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

    const patch: Record<string, string | boolean> = {};
    if (args.defaultBaseBranch !== undefined)
      patch.defaultBaseBranch = args.defaultBaseBranch;
    if (args.defaultModel !== undefined) patch.defaultModel = args.defaultModel;
    if (args.postAuditEnabled !== undefined)
      patch.postAuditEnabled = args.postAuditEnabled;
    if (args.accessibilityAuditEnabled !== undefined)
      patch.accessibilityAuditEnabled = args.accessibilityAuditEnabled;
    if (args.codeTestingAuditEnabled !== undefined)
      patch.codeTestingAuditEnabled = args.codeTestingAuditEnabled;
    if (args.codeReviewAuditEnabled !== undefined)
      patch.codeReviewAuditEnabled = args.codeReviewAuditEnabled;
    if (args.sessionsVncEnabled !== undefined)
      patch.sessionsVncEnabled = args.sessionsVncEnabled;
    if (args.sessionsVscodeEnabled !== undefined)
      patch.sessionsVscodeEnabled = args.sessionsVscodeEnabled;

    await ctx.db.patch(args.repoId, patch);
    return null;
  },
});

export const toggleHidden = authMutation({
  args: {
    repoId: v.id("githubRepos"),
    hidden: v.boolean(),
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
      hidden: args.hidden || undefined,
    });
    return null;
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
