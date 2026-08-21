import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { DatabaseReader } from "./_generated/server";
import { authQuery, hasRepoAccess } from "./functions";
import { filterActiveEntities } from "./numId";
import { DAILY_STANDUP_KEY } from "./_automations/systemAutomations";

/** A month of a daily automation — deep enough to never need paging. */
const ENTRY_LIMIT = 31;

/**
 * This repo's active "Daily standup" install, matched by system key (unlike
 * the global changelog, which is title-matched across every repo).
 */
async function findStandupAutomation(
  db: DatabaseReader,
  repoId: Id<"githubRepos">,
): Promise<Doc<"automations"> | null> {
  const rows = filterActiveEntities(
    await db
      .query("automations")
      .withIndex("by_repo", (q) => q.eq("repoId", repoId))
      .collect(),
  );
  return rows.find((row) => row.systemKey === DAILY_STANDUP_KEY) ?? null;
}

/**
 * Whether the Today tab should show for this repo: the standup automation is
 * installed and switched on. Subscribed from the sidebar, so it stays a bare
 * boolean rather than returning the feed.
 */
export const isStandupEnabled = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) {
      return false;
    }
    const automation = await findStandupAutomation(ctx.db, args.repoId);
    return automation?.enabled === true;
  },
});

/**
 * Every published standup of this repo, newest first, for the Today page.
 * Deliberately ignores `enabled` — pausing the automation hides the tab but
 * keeps the history reachable by URL.
 */
export const listStandups = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(
    v.object({
      id: v.id("automationRuns"),
      content: v.string(),
      publishedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) {
      return [];
    }
    const automation = await findStandupAutomation(ctx.db, args.repoId);
    if (!automation) return [];

    const runs = await ctx.db
      .query("automationRuns")
      .withIndex("by_automation_and_status", (q) =>
        q.eq("automationId", automation._id).eq("status", "success"),
      )
      .order("desc")
      .take(ENTRY_LIMIT);

    // A successful run can still finish without a summary; those have nothing
    // to render, so drop them rather than show blank cards.
    return runs.flatMap((run) =>
      run.resultSummary && run.finishedAt
        ? [
            {
              id: run._id,
              content: run.resultSummary,
              publishedAt: run.finishedAt,
            },
          ]
        : [],
    );
  },
});
