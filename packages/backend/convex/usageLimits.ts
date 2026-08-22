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
  /**
   * The account's current name, resolved on read rather than stored, so a
   * rename shows up without rewriting rows. Absent when the run used the shared
   * team credential, or when the account has since been deleted.
   */
  accountLabel: v.optional(v.string()),
});

/**
 * Upserts the reading for one (repo, provider, account) triple. Replaces rather
 * than patches: each report is a whole snapshot, so a window or token count the
 * provider no longer reports must disappear instead of going stale.
 *
 * The account is part of the key because plan limits are per account — keyed on
 * the provider alone, a second connected account's reading would overwrite the
 * first. A run on the shared team credential reports no account and keeps its
 * own row.
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
      .withIndex("by_repo_provider_account", (q) =>
        q
          .eq("repoId", args.repoId)
          .eq("provider", args.provider)
          .eq("providerAccountId", args.providerAccountId),
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

/**
 * Every account's latest reading for a repo, most recently captured first. One
 * provider can appear more than once — once per connected account it has run on.
 */
export const getByRepo = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(agentUsageLimitValidator),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) return [];
    const rows = await ctx.db
      .query("agentUsageLimits")
      .withIndex("by_repo_provider_account", (q) => q.eq("repoId", args.repoId))
      .collect();
    rows.sort((a, b) => b.capturedAt - a.capturedAt);
    return await Promise.all(
      rows.map(async (row) => {
        const account = row.providerAccountId
          ? await ctx.db.get(row.providerAccountId)
          : null;
        return { ...row, ...(account ? { accountLabel: account.label } : {}) };
      }),
    );
  },
});
