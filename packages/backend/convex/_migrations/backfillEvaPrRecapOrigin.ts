import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { isEvaOwnedPullRequest } from "../_github/evaPrOwnership";

/**
 * Tags existing Eva-managed PR recap docs with `prRecapOrigin: "eva"` so the
 * docs Reviews sidebar stops listing them (they belong on sandbox Review).
 *
 * Run once: `npx convex run migrations:backfillEvaPrRecapOrigin`
 * Delete after prod + staging have been patched.
 */
export const backfillEvaPrRecapOrigin = internalMutation({
  args: {},
  returns: v.object({
    scanned: v.number(),
    patched: v.number(),
  }),
  handler: async (ctx) => {
    const docs = await ctx.db.query("docs").collect();
    let scanned = 0;
    let patched = 0;

    for (const doc of docs) {
      if (doc.kind !== "pr-recap") continue;
      if (doc.prRecapOrigin === "eva") continue;
      if (doc.prUrl === undefined) continue;
      scanned++;

      const evaOwned = await isEvaOwnedPullRequest(ctx, doc.prUrl);
      if (!evaOwned) continue;

      await ctx.db.patch(doc._id, { prRecapOrigin: "eva" });
      patched++;
    }

    console.log(
      `[migration] backfillEvaPrRecapOrigin: scanned=${scanned} patched=${patched}`,
    );
    return { scanned, patched };
  },
});
