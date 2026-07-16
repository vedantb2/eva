import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalMutation } from "../_generated/server";

const BATCH_SIZE = 50;

/**
 * Deletes legacy evaluationReports rows that still carry the old per-requirement
 * `results` shape (and no `issues`). The testing arena now stores severity-ranked
 * `issues`; these disposable old test runs are cleared rather than migrated.
 *
 * Paginates so large tables stay within per-function limits. Run via:
 *   npx convex run migrations:clearEvaluationReports
 */
export const clearEvaluationReports = internalMutation({
  args: {
    cursor: v.optional(v.string()),
    deleted: v.optional(v.number()),
  },
  returns: v.object({
    deleted: v.number(),
    done: v.boolean(),
  }),
  handler: async (ctx, args) => {
    let deleted = args.deleted ?? 0;

    const page = await ctx.db.query("evaluationReports").paginate({
      cursor: args.cursor ?? null,
      numItems: BATCH_SIZE,
    });

    for (const report of page.page) {
      if (report.issues === undefined) {
        await ctx.db.delete(report._id);
        deleted++;
      }
    }

    if (!page.isDone) {
      await ctx.scheduler.runAfter(
        0,
        internal.migrations.clearEvaluationReports,
        { cursor: page.continueCursor, deleted },
      );
      return { deleted, done: false };
    }

    console.log(
      `[migration] clearEvaluationReports: deleted ${deleted} legacy reports`,
    );
    return { deleted, done: true };
  },
});
