import { v } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import type { Id } from "../_generated/dataModel";
import { internalMutation } from "../_generated/server";
import { hasRepoReferences, normalizePath } from "../repoUtils";

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
        .withIndex("by_owner_and_name", (q) =>
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
      defaultBaseBranch: "main",
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
        .withIndex("by_owner_and_name", (q) =>
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
