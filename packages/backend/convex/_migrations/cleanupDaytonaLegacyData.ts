import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalMutation } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

/** Same pattern as resolveExistingSandboxId.DAYTONA_UUID — legacy Daytona sandbox ids. */
const DAYTONA_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** agentRuns carry large log blobs — keep pages tiny to stay under the read limit. */
const PAGE_SIZE = 4;

const DUAL_ID_TABLES = [
  "agentTasks",
  "agentRuns",
  "sessions",
  "projects",
  "automationRuns",
  "docs",
  "designSessions",
] as const;

type DualIdTable = (typeof DUAL_ID_TABLES)[number];

function isDaytonaUuid(value: string | undefined): boolean {
  return typeof value === "string" && DAYTONA_UUID.test(value);
}

function nextDualIdTable(current: DualIdTable | undefined): DualIdTable | null {
  if (current === undefined) return DUAL_ID_TABLES[0];
  const index = DUAL_ID_TABLES.indexOf(current);
  if (index < 0 || index + 1 >= DUAL_ID_TABLES.length) return null;
  return DUAL_ID_TABLES[index + 1];
}

type DualIdDoc = {
  _id: Id<DualIdTable>;
  sandboxId?: string;
  vercelSandboxId?: string;
};

/**
 * Phase-1 Daytona legacy backfill (paginated — prod tables exceed the per-call
 * read byte limit when collected wholesale).
 *
 * Steps: delete daytona snapshotBuilds → dual-id collapse per table →
 * delete UUID git credentials → report non-snap_* repoSnapshots.
 *
 * Does not drop schema fields — that is phase 2 after this has run everywhere.
 */
export const cleanupDaytonaLegacyData = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()),
    step: v.optional(
      v.union(
        v.literal("builds"),
        v.literal("dualIds"),
        v.literal("gitCreds"),
        v.literal("snapshots"),
      ),
    ),
    table: v.optional(
      v.union(
        v.literal("agentTasks"),
        v.literal("agentRuns"),
        v.literal("sessions"),
        v.literal("projects"),
        v.literal("automationRuns"),
        v.literal("docs"),
        v.literal("designSessions"),
      ),
    ),
    cursor: v.optional(v.string()),
    daytonaBuildsDeleted: v.optional(v.number()),
    dualIdDocsPatched: v.optional(v.number()),
    uuidSandboxIdsCleared: v.optional(v.number()),
    vercelIdsPromoted: v.optional(v.number()),
    gitCredentialsDeleted: v.optional(v.number()),
  },
  returns: v.object({
    dryRun: v.boolean(),
    done: v.boolean(),
    step: v.string(),
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
    const step = args.step ?? "builds";
    let daytonaBuildsDeleted = args.daytonaBuildsDeleted ?? 0;
    let dualIdDocsPatched = args.dualIdDocsPatched ?? 0;
    let uuidSandboxIdsCleared = args.uuidSandboxIdsCleared ?? 0;
    let vercelIdsPromoted = args.vercelIdsPromoted ?? 0;
    let gitCredentialsDeleted = args.gitCredentialsDeleted ?? 0;
    const emptyNonSnap: Array<{
      repoSnapshotId: Id<"repoSnapshots">;
      repoId: Id<"githubRepos">;
      snapshotName: string;
      baseSnapshotId?: string;
    }> = [];

    if (step === "builds") {
      const page = await ctx.db.query("snapshotBuilds").paginate({
        cursor: args.cursor ?? null,
        numItems: PAGE_SIZE,
      });
      for (const build of page.page) {
        const provider: string | undefined = build.provider;
        if (provider !== "daytona") continue;
        daytonaBuildsDeleted++;
        if (!dryRun) {
          await ctx.db.delete(build._id);
        }
      }
      if (!page.isDone) {
        await ctx.scheduler.runAfter(
          0,
          internal.migrations.cleanupDaytonaLegacyData,
          {
            dryRun,
            step: "builds",
            cursor: page.continueCursor,
            daytonaBuildsDeleted,
            dualIdDocsPatched,
            uuidSandboxIdsCleared,
            vercelIdsPromoted,
            gitCredentialsDeleted,
          },
        );
        return {
          dryRun,
          done: false,
          step: "builds",
          daytonaBuildsDeleted,
          dualIdDocsPatched,
          uuidSandboxIdsCleared,
          vercelIdsPromoted,
          gitCredentialsDeleted,
          nonSnapSnapshotNames: emptyNonSnap,
        };
      }
      await ctx.scheduler.runAfter(
        0,
        internal.migrations.cleanupDaytonaLegacyData,
        {
          dryRun,
          step: "dualIds",
          table: "agentTasks",
          daytonaBuildsDeleted,
          dualIdDocsPatched,
          uuidSandboxIdsCleared,
          vercelIdsPromoted,
          gitCredentialsDeleted,
        },
      );
      return {
        dryRun,
        done: false,
        step: "builds",
        daytonaBuildsDeleted,
        dualIdDocsPatched,
        uuidSandboxIdsCleared,
        vercelIdsPromoted,
        gitCredentialsDeleted,
        nonSnapSnapshotNames: emptyNonSnap,
      };
    }

    if (step === "dualIds") {
      const table: DualIdTable = args.table ?? "agentTasks";
      const page = await ctx.db.query(table).paginate({
        cursor: args.cursor ?? null,
        numItems: PAGE_SIZE,
      });
      for (const raw of page.page) {
        const doc: DualIdDoc = raw;
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

      if (!page.isDone) {
        await ctx.scheduler.runAfter(
          0,
          internal.migrations.cleanupDaytonaLegacyData,
          {
            dryRun,
            step: "dualIds",
            table,
            cursor: page.continueCursor,
            daytonaBuildsDeleted,
            dualIdDocsPatched,
            uuidSandboxIdsCleared,
            vercelIdsPromoted,
            gitCredentialsDeleted,
          },
        );
        return {
          dryRun,
          done: false,
          step: `dualIds:${table}`,
          daytonaBuildsDeleted,
          dualIdDocsPatched,
          uuidSandboxIdsCleared,
          vercelIdsPromoted,
          gitCredentialsDeleted,
          nonSnapSnapshotNames: emptyNonSnap,
        };
      }

      const nextTable = nextDualIdTable(table);
      if (nextTable !== null) {
        await ctx.scheduler.runAfter(
          0,
          internal.migrations.cleanupDaytonaLegacyData,
          {
            dryRun,
            step: "dualIds",
            table: nextTable,
            daytonaBuildsDeleted,
            dualIdDocsPatched,
            uuidSandboxIdsCleared,
            vercelIdsPromoted,
            gitCredentialsDeleted,
          },
        );
        return {
          dryRun,
          done: false,
          step: `dualIds:${table}`,
          daytonaBuildsDeleted,
          dualIdDocsPatched,
          uuidSandboxIdsCleared,
          vercelIdsPromoted,
          gitCredentialsDeleted,
          nonSnapSnapshotNames: emptyNonSnap,
        };
      }

      await ctx.scheduler.runAfter(
        0,
        internal.migrations.cleanupDaytonaLegacyData,
        {
          dryRun,
          step: "gitCreds",
          daytonaBuildsDeleted,
          dualIdDocsPatched,
          uuidSandboxIdsCleared,
          vercelIdsPromoted,
          gitCredentialsDeleted,
        },
      );
      return {
        dryRun,
        done: false,
        step: `dualIds:${table}`,
        daytonaBuildsDeleted,
        dualIdDocsPatched,
        uuidSandboxIdsCleared,
        vercelIdsPromoted,
        gitCredentialsDeleted,
        nonSnapSnapshotNames: emptyNonSnap,
      };
    }

    if (step === "gitCreds") {
      const page = await ctx.db.query("sandboxGitCredentials").paginate({
        cursor: args.cursor ?? null,
        numItems: PAGE_SIZE,
      });
      for (const cred of page.page) {
        if (!isDaytonaUuid(cred.sandboxId)) continue;
        gitCredentialsDeleted++;
        if (!dryRun) {
          await ctx.db.delete(cred._id);
        }
      }
      if (!page.isDone) {
        await ctx.scheduler.runAfter(
          0,
          internal.migrations.cleanupDaytonaLegacyData,
          {
            dryRun,
            step: "gitCreds",
            cursor: page.continueCursor,
            daytonaBuildsDeleted,
            dualIdDocsPatched,
            uuidSandboxIdsCleared,
            vercelIdsPromoted,
            gitCredentialsDeleted,
          },
        );
        return {
          dryRun,
          done: false,
          step: "gitCreds",
          daytonaBuildsDeleted,
          dualIdDocsPatched,
          uuidSandboxIdsCleared,
          vercelIdsPromoted,
          gitCredentialsDeleted,
          nonSnapSnapshotNames: emptyNonSnap,
        };
      }
      await ctx.scheduler.runAfter(
        0,
        internal.migrations.cleanupDaytonaLegacyData,
        {
          dryRun,
          step: "snapshots",
          daytonaBuildsDeleted,
          dualIdDocsPatched,
          uuidSandboxIdsCleared,
          vercelIdsPromoted,
          gitCredentialsDeleted,
        },
      );
      return {
        dryRun,
        done: false,
        step: "gitCreds",
        daytonaBuildsDeleted,
        dualIdDocsPatched,
        uuidSandboxIdsCleared,
        vercelIdsPromoted,
        gitCredentialsDeleted,
        nonSnapSnapshotNames: emptyNonSnap,
      };
    }

    // step === "snapshots" — final page; repoSnapshots are small enough to collect.
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
      `[migration] cleanupDaytonaLegacyData${dryRun ? " (dry run)" : ""} DONE: ` +
        `buildsDeleted=${daytonaBuildsDeleted}, dualIdPatched=${dualIdDocsPatched}, ` +
        `uuidCleared=${uuidSandboxIdsCleared}, vercelPromoted=${vercelIdsPromoted}, ` +
        `gitCredsDeleted=${gitCredentialsDeleted}, nonSnapSnapshots=${nonSnapSnapshotNames.length}`,
    );

    return {
      dryRun,
      done: true,
      step: "snapshots",
      daytonaBuildsDeleted,
      dualIdDocsPatched,
      uuidSandboxIdsCleared,
      vercelIdsPromoted,
      gitCredentialsDeleted,
      nonSnapSnapshotNames,
    };
  },
});
