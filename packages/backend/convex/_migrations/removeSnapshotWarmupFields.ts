import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalMutation } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

type SeededAppStatus = "running" | "seeded" | "fallback";

type SeededAppDoc = {
  repoId: Id<"githubRepos">;
  seededSnapshotName: string | null;
  app?: string;
  status?: SeededAppStatus;
};

type LegacySeededAppJson = {
  warmupStatus?: string;
  warmupError?: string;
  seededSnapshotClass?: string;
};

type LegacyBuildJson = {
  warmupStatus?: string;
  warmupError?: string;
};

const BUILD_BATCH_SIZE = 1;

function readLegacySeededAppJson(app: SeededAppDoc): LegacySeededAppJson {
  const serialized = JSON.stringify(app);
  const parsed: SeededAppDoc & LegacySeededAppJson = JSON.parse(serialized);
  return {
    warmupStatus: parsed.warmupStatus,
    warmupError: parsed.warmupError,
    seededSnapshotClass: parsed.seededSnapshotClass,
  };
}

function seededAppHasLegacyFields(app: SeededAppDoc): boolean {
  const legacy = readLegacySeededAppJson(app);
  return (
    legacy.warmupStatus !== undefined ||
    legacy.warmupError !== undefined ||
    legacy.seededSnapshotClass !== undefined
  );
}

function cleanSeededApp(app: SeededAppDoc): SeededAppDoc {
  const cleaned: SeededAppDoc = {
    repoId: app.repoId,
    seededSnapshotName: app.seededSnapshotName,
  };
  if (app.app !== undefined) {
    cleaned.app = app.app;
  }
  if (app.status !== undefined) {
    cleaned.status = app.status;
  }
  return cleaned;
}

function readLegacyBuildJson(build: Doc<"snapshotBuilds">): LegacyBuildJson {
  const serialized = JSON.stringify(build);
  const parsed: Doc<"snapshotBuilds"> & LegacyBuildJson =
    JSON.parse(serialized);
  return {
    warmupStatus: parsed.warmupStatus,
    warmupError: parsed.warmupError,
  };
}

function buildNeedsClean(build: Doc<"snapshotBuilds">): boolean {
  const legacyBuild = readLegacyBuildJson(build);
  if (
    legacyBuild.warmupStatus !== undefined ||
    legacyBuild.warmupError !== undefined
  ) {
    return true;
  }
  const seededApps = build.seededApps;
  if (seededApps === undefined) {
    return false;
  }
  return seededApps.some((app) => seededAppHasLegacyFields(app));
}

function replaceSnapshotBuild(
  build: Doc<"snapshotBuilds">,
): Omit<Doc<"snapshotBuilds">, "_id" | "_creationTime"> {
  const seededApps = build.seededApps?.map((app) => cleanSeededApp(app));
  return {
    repoSnapshotId: build.repoSnapshotId,
    status: build.status,
    triggeredBy: build.triggeredBy,
    logs: build.logs,
    error: build.error,
    workflowRunId: build.workflowRunId,
    startedAt: build.startedAt,
    completedAt: build.completedAt,
    retryCount: build.retryCount,
    seededApps,
  };
}

/**
 * Strips removed warmup / snapshot-class fields from prod data so snapshot build
 * queries validate against the current seededAppResultValidator.
 *
 * Paginates one build at a time — build logs can be large enough to exceed the
 * per-function read limit when collected in bulk.
 */
export const removeSnapshotWarmupFields = internalMutation({
  args: {
    cursor: v.optional(v.string()),
    buildsPatched: v.optional(v.number()),
  },
  returns: v.object({
    buildsPatched: v.number(),
    done: v.boolean(),
  }),
  handler: async (ctx, args) => {
    let buildsPatched = args.buildsPatched ?? 0;

    const page = await ctx.db.query("snapshotBuilds").paginate({
      cursor: args.cursor ?? null,
      numItems: BUILD_BATCH_SIZE,
    });

    for (const build of page.page) {
      if (!buildNeedsClean(build)) {
        continue;
      }
      await ctx.db.replace(build._id, replaceSnapshotBuild(build));
      buildsPatched++;
    }

    if (!page.isDone) {
      await ctx.scheduler.runAfter(
        0,
        internal.migrations.removeSnapshotWarmupFields,
        {
          cursor: page.continueCursor,
          buildsPatched,
        },
      );
      return { buildsPatched, done: false };
    }

    console.log(
      `[migration] removeSnapshotWarmupFields: patched ${buildsPatched} snapshotBuilds`,
    );

    return { buildsPatched, done: true };
  },
});
