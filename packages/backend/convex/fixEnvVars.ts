import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/** Migrates env vars from hidden root repos to their child repos, merging without overwriting existing keys. */
export const run = internalMutation({
  args: {},
  returns: v.object({ moved: v.number() }),
  handler: async (ctx) => {
    let moved = 0;

    const allRepos = await ctx.db.query("githubRepos").collect();
    const hiddenRoots = allRepos.filter(
      (r) => r.hidden === true && r.rootDirectory === undefined,
    );

    for (const root of hiddenRoots) {
      const rootEnvVars = await ctx.db
        .query("repoEnvVars")
        .withIndex("by_repo", (q) => q.eq("repoId", root._id))
        .collect();

      if (rootEnvVars.length === 0) continue;

      const children = allRepos.filter(
        (r) => r.parentRepoId === root._id && r.rootDirectory !== undefined,
      );

      for (const envDoc of rootEnvVars) {
        for (const child of children) {
          const existing = await ctx.db
            .query("repoEnvVars")
            .withIndex("by_repo", (q) => q.eq("repoId", child._id))
            .first();

          if (existing) {
            const mergedKeys = new Set(existing.vars.map((v) => v.key));
            const newVars = [
              ...existing.vars,
              ...envDoc.vars.filter((v) => !mergedKeys.has(v.key)),
            ];
            await ctx.db.patch(existing._id, {
              vars: newVars,
              updatedAt: Date.now(),
            });
          } else {
            await ctx.db.insert("repoEnvVars", {
              repoId: child._id,
              vars: envDoc.vars,
              updatedAt: Date.now(),
            });
          }
          moved++;
        }

        await ctx.db.delete(envDoc._id);
      }
    }

    return { moved };
  },
});
