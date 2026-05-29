import { v } from "convex/values";
import { query, internalQuery } from "./_generated/server";
import { getCurrentUserId } from "./auth";
import { authMutation } from "./functions";

export const CHANGELOG_AUTOMATION_TITLE = "Eva Weekly Changelog";

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

/**
 * Returns a successful changelog run's markdown content for emailing, but only
 * if the run belongs to the "Eva Weekly Changelog" automation. Returns null
 * otherwise so the email action can safely no-op. Internal use only.
 */
export const getChangelogRunForEmail = internalQuery({
  args: { runId: v.id("automationRuns") },
  returns: v.union(
    v.object({
      content: v.string(),
      publishedAt: v.number(),
      runNumber: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run || run.status !== "success") return null;
    if (!run.resultSummary || !run.finishedAt) return null;
    const automation = await ctx.db.get(run.automationId);
    if (!automation || automation.title !== CHANGELOG_AUTOMATION_TITLE) {
      return null;
    }
    // Edition number = how many successful changelog runs exist (this one included).
    const successfulRuns = await ctx.db
      .query("automationRuns")
      .withIndex("by_automation_and_status", (q) =>
        q.eq("automationId", automation._id).eq("status", "success"),
      )
      .collect();
    return {
      content: run.resultSummary,
      publishedAt: run.finishedAt,
      runNumber: successfulRuns.length,
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
