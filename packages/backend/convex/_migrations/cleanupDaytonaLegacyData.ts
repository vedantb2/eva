import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

/** Same pattern as resolveExistingSandboxId.DAYTONA_UUID — legacy Daytona sandbox ids. */
const DAYTONA_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isDaytonaUuid(value: string | undefined): boolean {
  return typeof value === "string" && DAYTONA_UUID.test(value);
}

type DualSandboxDoc = {
  _id:
    | Id<"agentTasks">
    | Id<"agentRuns">
    | Id<"sessions">
    | Id<"projects">
    | Id<"automationRuns">
    | Id<"docs">
    | Id<"designSessions">;
  sandboxId?: string;
  vercelSandboxId?: string;
};

/**
 * Phase-1 Daytona legacy backfill (run before schema narrowing):
 * 1. Delete `snapshotBuilds` with `provider === "daytona"`.
 * 2. Collapse `vercelSandboxId` → `sandboxId` on dual-id tables; clear
 *    Daytona-UUID `sandboxId` when there is no Vercel id to promote.
 * 3. Delete `sandboxGitCredentials` rows whose `sandboxId` is a Daytona UUID.
 * 4. Report `repoSnapshots` whose names are not `snap_*` (Rebuild Now is manual).
 *
 * Does not drop schema fields — that is phase 2 after this has run everywhere.
 */
export const cleanupDaytonaLegacyData = internalMutation({
  args: { dryRun: v.optional(v.boolean()) },
  returns: v.object({
    dryRun: v.boolean(),
    daytonaBuildsDeleted: v.number(),
    dualIdDocsPatched: v.number(),
    uuidSandboxIdsCleared: v.number(),
    vercelIdsPromoted: v.number(),
    gitCredentialsDeleted: v.number(),
    nonSnapSnapshotNames: v.array(
      v.object({
        repoSnapshotId: v.id("repoSnapshots"),
        repoId: v.id("githubRepos"),
        snapshotName: v.string(),
        baseSnapshotId: v.optional(v.string()),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const dryRun = args.dryRun ?? false;
    let daytonaBuildsDeleted = 0;
    let dualIdDocsPatched = 0;
    let uuidSandboxIdsCleared = 0;
    let vercelIdsPromoted = 0;
    let gitCredentialsDeleted = 0;

    const builds = await ctx.db.query("snapshotBuilds").collect();
    for (const build of builds) {
      if (build.provider !== "daytona") continue;
      daytonaBuildsDeleted++;
      if (!dryRun) {
        await ctx.db.delete(build._id);
      }
    }

    const dualIdDocs: DualSandboxDoc[] = [
      ...(await ctx.db.query("agentTasks").collect()),
      ...(await ctx.db.query("agentRuns").collect()),
      ...(await ctx.db.query("sessions").collect()),
      ...(await ctx.db.query("projects").collect()),
      ...(await ctx.db.query("automationRuns").collect()),
      ...(await ctx.db.query("docs").collect()),
      ...(await ctx.db.query("designSessions").collect()),
    ];

    for (const doc of dualIdDocs) {
      const vercelId = doc.vercelSandboxId;
      const sandboxId = doc.sandboxId;
      const promoteVercel =
        typeof vercelId === "string" &&
        vercelId.length > 0 &&
        sandboxId !== vercelId;
      const clearUuid =
        isDaytonaUuid(sandboxId) &&
        (vercelId === undefined || vercelId.length === 0);

      if (!promoteVercel && !clearUuid) continue;

      dualIdDocsPatched++;
      if (promoteVercel) vercelIdsPromoted++;
      if (clearUuid) uuidSandboxIdsCleared++;
      if (dryRun) continue;

      if (promoteVercel && typeof vercelId === "string") {
        await ctx.db.patch(doc._id, { sandboxId: vercelId });
      } else {
        await ctx.db.patch(doc._id, { sandboxId: undefined });
      }
    }

    const creds = await ctx.db.query("sandboxGitCredentials").collect();
    for (const cred of creds) {
      if (!isDaytonaUuid(cred.sandboxId)) continue;
      gitCredentialsDeleted++;
      if (!dryRun) {
        await ctx.db.delete(cred._id);
      }
    }

    const nonSnapSnapshotNames: Array<{
      repoSnapshotId: Id<"repoSnapshots">;
      repoId: Id<"githubRepos">;
      snapshotName: string;
      baseSnapshotId?: string;
    }> = [];
    const snapshots = await ctx.db.query("repoSnapshots").collect();
    for (const snap of snapshots) {
      const nameIsSnap = snap.snapshotName.startsWith("snap_");
      const baseIsSnap =
        snap.baseSnapshotId === undefined ||
        snap.baseSnapshotId.startsWith("snap_");
      if (nameIsSnap && baseIsSnap) continue;
      nonSnapSnapshotNames.push({
        repoSnapshotId: snap._id,
        repoId: snap.repoId,
        snapshotName: snap.snapshotName,
        baseSnapshotId: snap.baseSnapshotId,
      });
    }

    console.log(
      `[migration] cleanupDaytonaLegacyData${dryRun ? " (dry run)" : ""}: ` +
        `buildsDeleted=${daytonaBuildsDeleted}, dualIdPatched=${dualIdDocsPatched}, ` +
        `uuidCleared=${uuidSandboxIdsCleared}, vercelPromoted=${vercelIdsPromoted}, ` +
        `gitCredsDeleted=${gitCredentialsDeleted}, nonSnapSnapshots=${nonSnapSnapshotNames.length}`,
    );

    return {
      dryRun,
      daytonaBuildsDeleted,
      dualIdDocsPatched,
      uuidSandboxIdsCleared,
      vercelIdsPromoted,
      gitCredentialsDeleted,
      nonSnapSnapshotNames,
    };
  },
});
