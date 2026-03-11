import { internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const checkRepoAccessForUser = internalQuery({
  args: { repoId: v.string(), userId: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args): Promise<boolean> => {
    const allRepos = await ctx.db.query("githubRepos").collect();
    const repo = allRepos.find((r) => r._id === args.repoId);
    if (!repo) return false;
    if (repo.connectedBy === args.userId) return true;
    const teamId = repo.teamId;
    if (!teamId) return false;
    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", teamId))
      .collect();
    return members.some((m) => m.userId === args.userId);
  },
});
