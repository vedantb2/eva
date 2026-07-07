import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * One-shot migration for the single-snapshot refactor. Clears fields that the
 * new model no longer uses so they can be removed from the schema/validators:
 *   - snapshotBuilds.warmupStatus / warmupError (warmup step removed)
 *   - snapshotBuilds.seededApps[].warmupStatus / warmupError / seededSnapshotClass
 *   - githubRepos.seededSnapshotClass / vmHotSeededSnapshots (never populated)
 *
 * Must run BEFORE the fields are removed from the schema: patching a field to
 * undefined requires it to still be declared optional. After this runs and the
 * schema is trimmed, delete this file.
 */
export const removeSnapshotWarmupFields = internalMutation({
  args: {},
  returns: v.object({
    buildsCleared: v.number(),
    seededAppEntriesCleared: v.number(),
    reposCleared: v.number(),
  }),
  handler: async (ctx) => {
    let buildsCleared = 0;
    let seededAppEntriesCleared = 0;
    let reposCleared = 0;

    const builds = await ctx.db.query("snapshotBuilds").collect();
    for (const build of builds) {
      const hasTopLevelWarmup =
        build.warmupStatus !== undefined || build.warmupError !== undefined;

      // Strip per-app warmup/class keys from each seededApps entry.
      let seededAppsChanged = false;
      const cleanedSeededApps = (build.seededApps ?? []).map((entry) => {
        if (
          entry.warmupStatus === undefined &&
          entry.warmupError === undefined &&
          entry.seededSnapshotClass === undefined
        ) {
          return entry;
        }
        seededAppsChanged = true;
        seededAppEntriesCleared++;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { warmupStatus, warmupError, seededSnapshotClass, ...keep } =
          entry;
        return keep;
      });

      if (!hasTopLevelWarmup && !seededAppsChanged) continue;

      await ctx.db.patch(build._id, {
        warmupStatus: undefined,
        warmupError: undefined,
        ...(seededAppsChanged ? { seededApps: cleanedSeededApps } : {}),
      });
      buildsCleared++;
    }

    const repos = await ctx.db.query("githubRepos").collect();
    for (const repo of repos) {
      if (
        repo.seededSnapshotClass === undefined &&
        repo.vmHotSeededSnapshots === undefined
      ) {
        continue;
      }
      await ctx.db.patch(repo._id, {
        seededSnapshotClass: undefined,
        vmHotSeededSnapshots: undefined,
      });
      reposCleared++;
    }

    return { buildsCleared, seededAppEntriesCleared, reposCleared };
  },
});
