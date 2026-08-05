import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

/**
 * Archives sessions whose PR is already merged/closed but `archived` was never
 * set (pre–archive-on-PR-terminal behavior).
 *
 * Run once on each deployment:
 *   npx convex run migrations:backfillArchivedFromPrState
 *   npx convex run migrations:backfillArchivedFromPrState --prod
 */
export const backfillArchivedFromPrState = internalMutation({
  args: {},
  returns: v.object({ sessionsPatched: v.number() }),
  handler: async (ctx) => {
    let sessionsPatched = 0;
    const sessions = await ctx.db.query("sessions").collect();
    for (const session of sessions) {
      if (session.archived === true) continue;
      if (session.prState !== "merged" && session.prState !== "closed") {
        continue;
      }
      await ctx.db.patch(session._id, {
        archived: true,
        updatedAt: Date.now(),
      });
      sessionsPatched++;
    }
    console.log(
      `[migration] backfillArchivedFromPrState: patched ${sessionsPatched} sessions`,
    );
    return { sessionsPatched };
  },
});
