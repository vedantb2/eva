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

/** Internal query to get GitHub repo metadata (owner, name, installationId). */
export const getRepo = internalQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.union(
    v.object({
      owner: v.string(),
      name: v.string(),
      installationId: v.number(),
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
    };
  },
});
