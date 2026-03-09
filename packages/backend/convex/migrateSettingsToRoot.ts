import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const run = internalMutation({
  args: {},
  returns: v.object({
    snapshots: v.number(),
    auditCategories: v.number(),
    envVars: v.number(),
  }),
  handler: async (ctx) => {
    let snapshots = 0;
    let auditCategories = 0;
    let envVars = 0;

    const allRepos = await ctx.db.query("githubRepos").collect();
    const childRepos = allRepos.filter((r) => r.parentRepoId !== undefined);

    for (const child of childRepos) {
      const parentId = child.parentRepoId;
      if (!parentId) continue;

      const childSnapshots = await ctx.db
        .query("repoSnapshots")
        .withIndex("by_repo", (q) => q.eq("repoId", child._id))
        .collect();
      for (const s of childSnapshots) {
        await ctx.db.patch(s._id, { repoId: parentId });
        snapshots++;
      }

      const childCategories = await ctx.db
        .query("auditCategories")
        .withIndex("by_repo", (q) => q.eq("repoId", child._id))
        .collect();
      for (const c of childCategories) {
        await ctx.db.patch(c._id, { repoId: parentId });
        auditCategories++;
      }

      const childEnvVars = await ctx.db
        .query("repoEnvVars")
        .withIndex("by_repo", (q) => q.eq("repoId", child._id))
        .collect();
      for (const e of childEnvVars) {
        await ctx.db.patch(e._id, { repoId: parentId });
        envVars++;
      }
    }

    return { snapshots, auditCategories, envVars };
  },
});
