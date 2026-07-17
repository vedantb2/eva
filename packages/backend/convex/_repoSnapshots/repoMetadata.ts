import { v } from "convex/values";
import { internalQuery } from "../_generated/server";

/** Returns the startup commands for a repo/app, if any. */
export const getStartupCommands = internalQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.union(v.array(v.string()), v.null()),
  handler: async (ctx, args) => {
    const repo = await ctx.db.get(args.repoId);
    if (!repo) return null;
    return repo.startupCommands ?? null;
  },
});

/** Returns the background commands for a repo/app, if any. */
export const getBackgroundCommands = internalQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.union(v.array(v.string()), v.null()),
  handler: async (ctx, args) => {
    const repo = await ctx.db.get(args.repoId);
    if (!repo) return null;
    return repo.backgroundCommands ?? null;
  },
});

/** Returns the clean-stop commands for a repo/app, if any. */
export const getStopCommands = internalQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.union(v.array(v.string()), v.null()),
  handler: async (ctx, args) => {
    const repo = await ctx.db.get(args.repoId);
    if (!repo) return null;
    return repo.stopCommands ?? null;
  },
});

/** Internal query to get GitHub repo metadata (owner, name, installationId). */
export const getRepo = internalQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.union(
    v.object({
      owner: v.string(),
      name: v.string(),
      installationId: v.number(),
      stopCommands: v.optional(v.array(v.string())),
      seededSnapshotName: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const repo = await ctx.db.get(args.repoId);
    if (!repo) return null;
    return {
      owner: repo.owner,
      name: repo.name,
      installationId: repo.installationId,
      stopCommands: repo.stopCommands,
      seededSnapshotName: repo.seededSnapshotName,
    };
  },
});

/** Resolves sandbox provider for a repo. Env values are encrypted — only actions
 *  can decrypt; do not use this for UI display (read `snapshotBuilds.provider`). */
export const getRepoSandboxProvider = internalQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.union(v.literal("vercel"), v.literal("daytona")),
  handler: async (ctx, args) => {
    const repo = await ctx.db.get(args.repoId);
    if (!repo) return "daytona"; // default fallback

    let provider: "vercel" | "daytona" = "daytona";

    // Check team-level SANDBOX_PROVIDER
    if (repo.teamId) {
      const teamId = repo.teamId;
      const teamVarsDocs = await ctx.db
        .query("teamEnvVars")
        .withIndex("by_team", (q) => q.eq("teamId", teamId))
        .collect();

      const teamVar = teamVarsDocs
        .flatMap((doc) => doc.vars)
        .find((v) => v.key === "SANDBOX_PROVIDER");
      if (teamVar?.value === "vercel") {
        provider = "vercel";
      }
    }

    // Check repo-level override
    const repoVarsDocs = await ctx.db
      .query("repoEnvVars")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();

    const repoVar = repoVarsDocs
      .flatMap((doc) => doc.vars)
      .find((v) => v.key === "SANDBOX_PROVIDER");
    if (repoVar?.value === "vercel") {
      provider = "vercel";
    } else if (repoVar) {
      // Repo override set to non-vercel → default to daytona
      provider = "daytona";
    }

    return provider;
  },
});
