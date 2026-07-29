import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

/** Env var keys with no consumer since the Daytona provider removal. */
const DEAD_ENV_VAR_KEYS: ReadonlySet<string> = new Set([
  "DAYTONA_API_KEY",
  "SANDBOX_PROVIDER",
]);

/**
 * Strips dead Daytona-era entries (DAYTONA_API_KEY, SANDBOX_PROVIDER) from
 * every teamEnvVars / repoEnvVars doc. Nothing has read them since the
 * Daytona removal, but they were still decrypted and injected into every
 * sandbox — and DAYTONA_API_KEY is a live credential. Pass dryRun: true to
 * count matches without writing. Revoking the key itself must happen in the
 * Daytona dashboard; this only removes the stored copies.
 */
export const removeDaytonaEnvVars = internalMutation({
  args: { dryRun: v.optional(v.boolean()) },
  returns: v.object({
    dryRun: v.boolean(),
    docsPatched: v.number(),
    entriesRemoved: v.number(),
  }),
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? false;
    let docsPatched = 0;
    let entriesRemoved = 0;

    const teamDocs = await ctx.db.query("teamEnvVars").collect();
    for (const doc of teamDocs) {
      const kept = doc.vars.filter(
        (entry) => !DEAD_ENV_VAR_KEYS.has(entry.key),
      );
      if (kept.length === doc.vars.length) continue;
      entriesRemoved += doc.vars.length - kept.length;
      docsPatched++;
      if (!dryRun) {
        await ctx.db.patch(doc._id, { vars: kept, updatedAt: Date.now() });
      }
    }

    const repoDocs = await ctx.db.query("repoEnvVars").collect();
    for (const doc of repoDocs) {
      const kept = doc.vars.filter(
        (entry) => !DEAD_ENV_VAR_KEYS.has(entry.key),
      );
      if (kept.length === doc.vars.length) continue;
      entriesRemoved += doc.vars.length - kept.length;
      docsPatched++;
      if (!dryRun) {
        await ctx.db.patch(doc._id, { vars: kept, updatedAt: Date.now() });
      }
    }

    console.log(
      `[migration] removeDaytonaEnvVars${dryRun ? " (dry run)" : ""}: ` +
        `${entriesRemoved} entries across ${docsPatched} docs`,
    );
    return { dryRun, docsPatched, entriesRemoved };
  },
});
