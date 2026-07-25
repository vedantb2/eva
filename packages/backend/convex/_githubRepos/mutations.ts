import { v } from "convex/values";
import type { GenericDatabaseReader } from "convex/server";
import type { DataModel, Doc, Id } from "../_generated/dataModel";
import { internalMutation } from "../_generated/server";
import { authMutation } from "../functions";
import { normalizePath } from "../repoUtils";
import { aiModelValidator } from "../validators";
import { findAllSiblingRepoIds } from "./helpers";

/** Throws unless the user connected the repo or shares its team. */
async function assertRepoWriteAccess(
  db: GenericDatabaseReader<DataModel>,
  userId: Id<"users">,
  repo: Doc<"githubRepos">,
): Promise<void> {
  if (repo.connectedBy === userId) return;
  const teamId = repo.teamId;
  if (!teamId) throw new Error("Not authorized");
  const membership = await db
    .query("teamMembers")
    .withIndex("by_team_and_user", (q) =>
      q.eq("teamId", teamId).eq("userId", userId),
    )
    .first();
  if (!membership) throw new Error("Not authorized");
}

/** Assigns a repository to a team (team owner only). */
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

/** Removes a repository from a team (team owner only). */
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

/** Creates a new GitHub repo entry, handling deduplication and monorepo sub-app setup. */
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
      .withIndex("by_owner_and_name", (q) =>
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
      defaultBaseBranch: "staging",
    });
  },
});

/** Updates repository configuration settings, propagating shared settings to sibling repos. */
export const updateConfig = authMutation({
  args: {
    repoId: v.id("githubRepos"),
    defaultBaseBranch: v.optional(v.string()),
    defaultModel: v.optional(aiModelValidator),
    auditReviewModel: v.optional(aiModelValidator),
    auditFixModel: v.optional(aiModelValidator),
    proofModel: v.optional(aiModelValidator),
    prRecapsEnabled: v.optional(v.boolean()),
    prRecapModel: v.optional(aiModelValidator),
    sessionsVncEnabled: v.optional(v.boolean()),
    sessionsVscodeEnabled: v.optional(v.boolean()),
    deploymentProjectName: v.optional(v.string()),
    domains: v.optional(v.array(v.string())),
    devPort: v.optional(v.union(v.number(), v.null())),
    devCommand: v.optional(v.string()),
    startupCommands: v.optional(v.array(v.string())),
    backgroundCommands: v.optional(v.array(v.string())),
    stopCommands: v.optional(v.array(v.string())),
    systemPrompt: v.optional(v.string()),
    label: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const repo = await ctx.db.get(args.repoId);
    if (!repo) throw new Error("Repository not found");

    await assertRepoWriteAccess(ctx.db, ctx.userId, repo);

    const sharedPatch: Record<string, string | boolean> = {};
    if (args.defaultBaseBranch !== undefined)
      sharedPatch.defaultBaseBranch = args.defaultBaseBranch;
    if (args.defaultModel !== undefined)
      sharedPatch.defaultModel = args.defaultModel;
    if (args.auditReviewModel !== undefined)
      sharedPatch.auditReviewModel = args.auditReviewModel;
    if (args.auditFixModel !== undefined)
      sharedPatch.auditFixModel = args.auditFixModel;
    if (args.proofModel !== undefined) sharedPatch.proofModel = args.proofModel;
    if (args.prRecapsEnabled !== undefined)
      sharedPatch.prRecapsEnabled = args.prRecapsEnabled;
    if (args.prRecapModel !== undefined)
      sharedPatch.prRecapModel = args.prRecapModel;
    if (args.sessionsVncEnabled !== undefined)
      sharedPatch.sessionsVncEnabled = args.sessionsVncEnabled;
    if (args.sessionsVscodeEnabled !== undefined)
      sharedPatch.sessionsVscodeEnabled = args.sessionsVscodeEnabled;

    const siblingIds = await findAllSiblingRepoIds(ctx.db, args.repoId);
    for (const siblingId of siblingIds) {
      await ctx.db.patch(siblingId, sharedPatch);
    }

    if (args.deploymentProjectName !== undefined) {
      await ctx.db.patch(args.repoId, {
        deploymentProjectName: args.deploymentProjectName,
      });
    }

    if (args.domains !== undefined) {
      await ctx.db.patch(args.repoId, {
        domains: args.domains.length > 0 ? args.domains : undefined,
      });
    }

    // Per-app dev config: empty/null clears the override so detection falls back.
    if (args.devPort !== undefined) {
      await ctx.db.patch(args.repoId, {
        devPort: args.devPort === null ? undefined : args.devPort,
      });
    }

    if (args.devCommand !== undefined) {
      await ctx.db.patch(args.repoId, {
        devCommand:
          args.devCommand.trim().length > 0 ? args.devCommand : undefined,
      });
    }

    if (args.startupCommands !== undefined) {
      await ctx.db.patch(args.repoId, {
        startupCommands:
          args.startupCommands.length > 0 ? args.startupCommands : undefined,
      });
    }

    if (args.backgroundCommands !== undefined) {
      await ctx.db.patch(args.repoId, {
        backgroundCommands:
          args.backgroundCommands.length > 0
            ? args.backgroundCommands
            : undefined,
      });
    }

    if (args.stopCommands !== undefined) {
      await ctx.db.patch(args.repoId, {
        stopCommands:
          args.stopCommands.length > 0 ? args.stopCommands : undefined,
      });
    }

    if (args.systemPrompt !== undefined) {
      await ctx.db.patch(args.repoId, {
        systemPrompt:
          args.systemPrompt.trim().length > 0 ? args.systemPrompt : undefined,
      });
    }

    if (args.label !== undefined) {
      const trimmed = args.label.trim();
      await ctx.db.patch(args.repoId, {
        label: trimmed.length > 0 ? trimmed : undefined,
      });
    }

    return null;
  },
});

/** Generates a short-lived upload URL for a repo logo image (auth-checked). */
export const generateLogoUploadUrl = authMutation({
  args: { repoId: v.id("githubRepos") },
  returns: v.string(),
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

    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Sets (or clears with null) a repo's logo. Per-app: patches only this repo,
 * never siblings. Deletes the previously stored image so replacing or removing
 * a logo does not leave orphaned storage objects.
 */
export const setLogo = authMutation({
  args: {
    repoId: v.id("githubRepos"),
    storageId: v.union(v.id("_storage"), v.null()),
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

    const previousId = repo.logoStorageId;
    if (previousId && previousId !== args.storageId) {
      await ctx.storage.delete(previousId);
    }

    await ctx.db.patch(args.repoId, {
      logoStorageId: args.storageId ?? undefined,
    });
    return null;
  },
});

/** Toggles the hidden visibility flag on a repository. */
export const toggleHidden = authMutation({
  args: {
    repoId: v.id("githubRepos"),
    hidden: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const repo = await ctx.db.get(args.repoId);
    if (!repo) throw new Error("Repository not found");

    await assertRepoWriteAccess(ctx.db, ctx.userId, repo);

    await ctx.db.patch(args.repoId, {
      hidden: args.hidden || undefined,
    });
    return null;
  },
});

/** Updates the MCP root prompt for a repo and all its siblings. */
export const updateMcpRootPrompt = authMutation({
  args: {
    repoId: v.id("githubRepos"),
    mcpRootPrompt: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const repo = await ctx.db.get(args.repoId);
    if (!repo) throw new Error("Repository not found");

    await assertRepoWriteAccess(ctx.db, ctx.userId, repo);

    const siblingIds = await findAllSiblingRepoIds(ctx.db, args.repoId);
    for (const siblingId of siblingIds) {
      await ctx.db.patch(siblingId, {
        mcpRootPrompt: args.mcpRootPrompt,
      });
    }
    return null;
  },
});

/**
 * Sets an app repo's command config directly (internal, CLI/ops use). Stop
 * commands gate seeded-snapshot builds (findSeedableAppRepos), and updateConfig
 * is auth+ownership-checked so it cannot be driven from `npx convex run` when a
 * deployment's config needs backfilling or repair (e.g. prod after a dev-only
 * setup). Each array is optional; an empty array clears the field.
 */
export const setRepoCommandsInternal = internalMutation({
  args: {
    repoId: v.id("githubRepos"),
    startupCommands: v.optional(v.array(v.string())),
    backgroundCommands: v.optional(v.array(v.string())),
    stopCommands: v.optional(v.array(v.string())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const repo = await ctx.db.get(args.repoId);
    if (!repo) throw new Error("Repository not found");
    if (args.startupCommands !== undefined) {
      await ctx.db.patch(args.repoId, {
        startupCommands:
          args.startupCommands.length > 0 ? args.startupCommands : undefined,
      });
    }
    if (args.backgroundCommands !== undefined) {
      await ctx.db.patch(args.repoId, {
        backgroundCommands:
          args.backgroundCommands.length > 0
            ? args.backgroundCommands
            : undefined,
      });
    }
    if (args.stopCommands !== undefined) {
      await ctx.db.patch(args.repoId, {
        stopCommands:
          args.stopCommands.length > 0 ? args.stopCommands : undefined,
      });
    }
    return null;
  },
});

/** Deletes a GitHub repo entry by ID (internal use only). */
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
