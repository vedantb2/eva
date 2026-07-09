import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/** Dev-only: copy SANDBOX_PROVIDER from web repo to eprocurement sibling. */
export const run = internalMutation({
  args: {
    webRepoId: v.id("githubRepos"),
    eprocRepoId: v.id("githubRepos"),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const webDoc = await ctx.db
      .query("repoEnvVars")
      .withIndex("by_repo", (q) => q.eq("repoId", args.webRepoId))
      .first();
    const provider = webDoc?.vars.find(
      (entry) => entry.key === "SANDBOX_PROVIDER",
    );
    if (!provider) return "web SANDBOX_PROVIDER not found";

    const eprocDoc = await ctx.db
      .query("repoEnvVars")
      .withIndex("by_repo", (q) => q.eq("repoId", args.eprocRepoId))
      .first();
    if (!eprocDoc) return "eproc repoEnvVars doc not found";

    const without = eprocDoc.vars.filter(
      (entry) => entry.key !== "SANDBOX_PROVIDER",
    );
    await ctx.db.patch(eprocDoc._id, {
      vars: [
        ...without,
        {
          key: "SANDBOX_PROVIDER",
          value: provider.value,
          sandboxExclude: true,
        },
      ],
      updatedAt: Date.now(),
    });
    return "set SANDBOX_PROVIDER on eproc from web";
  },
});
