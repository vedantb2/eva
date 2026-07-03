import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Clears the orphaned `warmupStatus`/`warmupError` fields from all snapshotBuilds
 * after the snapshot-cache warmup feature was removed (its job is now covered by
 * the Step 5 propagation probe). This MUST run before the follow-up commit that
 * drops these fields from the schema — a schema push that omits them is rejected
 * while existing documents still carry them. Once this has run on every
 * deployment, delete this function and the schema fields.
 *
 * Paginated: build docs carry large `logs` strings, so a full-table `.collect()`
 * blows the 16MB per-function read limit on prod. Call repeatedly, threading
 * `cursor` from the previous result, until `isDone` is true:
 *   npx convex run migrations:dropWarmupFields '{"cursor": null}' --prod
 */
export const dropWarmupFields = internalMutation({
  args: { cursor: v.union(v.string(), v.null()) },
  returns: v.object({
    cleared: v.number(),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("snapshotBuilds")
      .paginate({ numItems: 50, cursor: args.cursor });
    let cleared = 0;
    for (const build of page.page) {
      if (build.warmupStatus !== undefined || build.warmupError !== undefined) {
        await ctx.db.patch(build._id, {
          warmupStatus: undefined,
          warmupError: undefined,
        });
        cleared++;
      }
    }
    console.log(
      `[migration] dropWarmupFields: cleared ${cleared} in this batch (isDone=${page.isDone})`,
    );
    return {
      cleared,
      isDone: page.isDone,
      continueCursor: page.continueCursor,
    };
  },
});
