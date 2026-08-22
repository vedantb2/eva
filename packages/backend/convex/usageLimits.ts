import { v } from "convex/values";
import { authMutation, authQuery, hasRepoAccess } from "./functions";
import { agentUsageLimitFields } from "./validators";

/**
 * Agent plan usage limits. A sandbox turn captures how much of the provider's
 * plan it has used and reports it here; the UI reads it back per repo.
 *
 * Deliberately its own mutation rather than extra completion arguments: the
 * completion mutation is shared by every entity workflow, and a reading that is
 * pure telemetry has no business widening that contract.
 *
 * Auth mirrors the completion mutations — the sandbox calls in with its
 * CONVEX_TOKEN identity (the launching user), so repo access is checked exactly
 * as `sessionWorkflow:handleCompletion` checks it.
 */

const agentUsageLimitValidator = v.object({
  _id: v.id("agentUsageLimits"),
  _creationTime: v.number(),
  ...agentUsageLimitFields,
});

/**
 * Upserts the reading for one (repo, provider) pair. Replaces rather than
 * patches: each report is a whole snapshot, so a window or token count the
 * provider no longer reports must disappear instead of going stale.
 */
export const report = authMutation({
  args: agentUsageLimitFields,
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    const existing = await ctx.db
      .query("agentUsageLimits")
      .withIndex("by_repo_and_provider", (q) =>
        q.eq("repoId", args.repoId).eq("provider", args.provider),
      )
      .first();
    if (existing) {
      await ctx.db.replace(existing._id, args);
      return null;
    }
    await ctx.db.insert("agentUsageLimits", args);
    return null;
  },
});

/** Every provider's latest reading for a repo, most recently captured first. */
export const getByRepo = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(agentUsageLimitValidator),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) return [];
    const rows = await ctx.db
      .query("agentUsageLimits")
      .withIndex("by_repo_and_provider", (q) => q.eq("repoId", args.repoId))
      .collect();
    return rows.sort((a, b) => b.capturedAt - a.capturedAt);
  },
});
