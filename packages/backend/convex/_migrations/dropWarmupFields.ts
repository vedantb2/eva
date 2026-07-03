import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Clears the orphaned `warmupStatus`/`warmupError` fields from all snapshotBuilds
 * after the snapshot-cache warmup feature was removed (its job is now covered by
 * the Step 5 propagation probe). This MUST run before the follow-up commit that
 * drops these fields from the schema — a schema push that omits them is rejected
 * while existing documents still carry them. Once this has run on every
 * deployment, delete this function and the schema fields.
 */
export const dropWarmupFields = internalMutation({
  args: {},
  returns: v.object({ cleared: v.number() }),
  handler: async (ctx) => {
    let cleared = 0;
    const builds = await ctx.db.query("snapshotBuilds").collect();
    for (const build of builds) {
      if (build.warmupStatus !== undefined || build.warmupError !== undefined) {
        await ctx.db.patch(build._id, {
          warmupStatus: undefined,
          warmupError: undefined,
        });
        cleared++;
      }
    }
    console.log(
      `[migration] dropWarmupFields: cleared ${cleared} snapshotBuilds`,
    );
    return { cleared };
  },
});
