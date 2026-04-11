import { v } from "convex/values";
import { query } from "./_generated/server";
import { getCurrentUserId } from "./auth";
import { authMutation } from "./functions";

const CHANGELOG_AUTOMATION_TITLE = "Eva Weekly Changelog";

/**
 * Returns the latest successful changelog automation run and whether the
 * current user should see the popup (i.e. they haven't dismissed it yet).
 * Uses a plain query so it returns null for unauthenticated users instead
 * of throwing — this lets the component live in the root layout.
 */
export const getLatestChangelog = query({
  args: {},
  returns: v.union(
    v.object({
      show: v.boolean(),
      content: v.string(),
      publishedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) return null;

    // Find the changelog automation by title across all repos.
    const allAutomations = await ctx.db.query("automations").collect();
    const automation = allAutomations.find(
      (a) => a.title === CHANGELOG_AUTOMATION_TITLE,
    );
    if (!automation) return null;

    const latestRun = await ctx.db
      .query("automationRuns")
      .withIndex("by_automation_and_status", (q) =>
        q.eq("automationId", automation._id).eq("status", "success"),
      )
      .order("desc")
      .first();

    if (!latestRun?.resultSummary || !latestRun.finishedAt) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    const dismissed = user.lastChangelogDismissedAt ?? 0;

    return {
      show: latestRun.finishedAt > dismissed,
      content: latestRun.resultSummary,
      publishedAt: latestRun.finishedAt,
    };
  },
});

/** Marks the current user as having dismissed the latest changelog. */
export const dismissChangelog = authMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await ctx.db.patch(ctx.userId, {
      lastChangelogDismissedAt: Date.now(),
    });
    return null;
  },
});
