import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { components } from "./_generated/api";
import { Crons } from "@convex-dev/crons";
import type { GenericDatabaseReader } from "convex/server";
import type { DataModel, Doc, Id } from "./_generated/dataModel";
import {
  snapshotScheduleValidator,
  snapshotBuildStatusValidator,
  snapshotBuildTriggerValidator,
} from "./validators";
import { authQuery, authMutation } from "./functions";

const crons = new Crons(components.crons);

const LEGACY_SCHEDULE_TO_CRON: Record<string, string> = {
  daily: "0 6 * * *",
  every_3_days: "0 6 */3 * *",
  weekly: "0 6 * * 1",
};

function resolveCronspec(schedule: string): string | null {
  if (schedule === "manual") return null;
  return LEGACY_SCHEDULE_TO_CRON[schedule] ?? schedule;
}

const STALE_BUILD_MS = 30 * 60 * 1000;

export const getRepoSnapshot = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.union(
    v.object({
      _id: v.id("repoSnapshots"),
      _creationTime: v.number(),
      repoId: v.id("githubRepos"),
      snapshotName: v.string(),
      schedule: snapshotScheduleValidator,
      cronJobId: v.optional(v.string()),
      workflowRef: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await findSnapshotForRepo(ctx.db, args.repoId);
  },
});

async function findSnapshotForRepo(
  db: GenericDatabaseReader<DataModel>,
  repoId: Id<"githubRepos">,
): Promise<Doc<"repoSnapshots"> | null> {
  const direct = await db
    .query("repoSnapshots")
    .withIndex("by_repo", (q) => q.eq("repoId", repoId))
    .first();
  if (direct) return direct;

  const repo = await db.get(repoId);
  if (!repo) return null;

  const siblings = await db
    .query("githubRepos")
    .withIndex("by_owner_and_name", (q) =>
      q.eq("owner", repo.owner).eq("name", repo.name),
    )
    .collect();

  for (const sibling of siblings) {
    if (sibling._id === repoId) continue;
    const siblingSnapshot = await db
      .query("repoSnapshots")
      .withIndex("by_repo", (q) => q.eq("repoId", sibling._id))
      .first();
    if (siblingSnapshot) return siblingSnapshot;
  }

  return null;
}

export const getRepoSnapshotName = internalQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.union(v.object({ snapshotName: v.string() }), v.null()),
  handler: async (ctx, args) => {
    const snapshot = await findSnapshotForRepo(ctx.db, args.repoId);
    if (!snapshot) return null;

    const latestSuccessfulBuild = await ctx.db
      .query("snapshotBuilds")
      .withIndex("by_repo_snapshot_and_status", (q) =>
        q.eq("repoSnapshotId", snapshot._id).eq("status", "success"),
      )
      .order("desc")
      .first();

    if (!latestSuccessfulBuild) return null;
    return { snapshotName: snapshot.snapshotName };
  },
});

export const listBuilds = authQuery({
  args: { repoSnapshotId: v.id("repoSnapshots") },
  returns: v.array(
    v.object({
      _id: v.id("snapshotBuilds"),
      _creationTime: v.number(),
      repoSnapshotId: v.id("repoSnapshots"),
      status: snapshotBuildStatusValidator,
      triggeredBy: snapshotBuildTriggerValidator,
      logs: v.string(),
      error: v.optional(v.string()),
      workflowRunId: v.optional(v.number()),
      startedAt: v.number(),
      completedAt: v.optional(v.number()),
    }),
  ),
  handler: async (ctx, args) => {
    const builds = await ctx.db
      .query("snapshotBuilds")
      .withIndex("by_repo_snapshot", (q) =>
        q.eq("repoSnapshotId", args.repoSnapshotId),
      )
      .order("desc")
      .take(20);
    return builds;
  },
});

export const getBuild = authQuery({
  args: { buildId: v.id("snapshotBuilds") },
  returns: v.union(
    v.object({
      _id: v.id("snapshotBuilds"),
      _creationTime: v.number(),
      repoSnapshotId: v.id("repoSnapshots"),
      status: snapshotBuildStatusValidator,
      triggeredBy: snapshotBuildTriggerValidator,
      logs: v.string(),
      error: v.optional(v.string()),
      workflowRunId: v.optional(v.number()),
      startedAt: v.number(),
      completedAt: v.optional(v.number()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.buildId);
  },
});

export const saveRepoSnapshot = authMutation({
  args: {
    repoId: v.id("githubRepos"),
    schedule: snapshotScheduleValidator,
    workflowRef: v.optional(v.string()),
  },
  returns: v.id("repoSnapshots"),
  handler: async (ctx, args) => {
    const existing = await findSnapshotForRepo(ctx.db, args.repoId);

    const canonicalRepoId = existing ? existing.repoId : args.repoId;
    const cronName = `snapshot-rebuild-${canonicalRepoId}`;
    const snapshotName = existing
      ? existing.snapshotName
      : `snapshot-${canonicalRepoId}`;

    if (existing) {
      if (existing.cronJobId) {
        try {
          await crons.delete(ctx, { name: cronName });
        } catch {
          // Cron may already be deleted
        }
      }

      let cronJobId: string | undefined;
      const cronspec = resolveCronspec(args.schedule);
      if (cronspec) {
        const id = await crons.register(
          ctx,
          { kind: "cron", cronspec },
          internal.repoSnapshots.triggerScheduledBuild,
          { repoSnapshotId: existing._id },
          cronName,
        );
        cronJobId = String(id);
      }

      await ctx.db.patch(existing._id, {
        schedule: args.schedule,
        cronJobId,
        workflowRef: args.workflowRef,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    const now = Date.now();
    const id = await ctx.db.insert("repoSnapshots", {
      repoId: canonicalRepoId,
      snapshotName,
      schedule: args.schedule,
      workflowRef: args.workflowRef,
      createdAt: now,
      updatedAt: now,
    });

    const cronspec = resolveCronspec(args.schedule);
    if (cronspec) {
      const cronId = await crons.register(
        ctx,
        { kind: "cron", cronspec },
        internal.repoSnapshots.triggerScheduledBuild,
        { repoSnapshotId: id },
        cronName,
      );
      await ctx.db.patch(id, { cronJobId: String(cronId) });
    }

    return id;
  },
});

export const deleteRepoSnapshot = authMutation({
  args: { repoSnapshotId: v.id("repoSnapshots") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const config = await ctx.db.get(args.repoSnapshotId);
    if (!config) return null;

    const cronName = `snapshot-rebuild-${config.repoId}`;
    if (config.cronJobId) {
      try {
        await crons.delete(ctx, { name: cronName });
      } catch {
        // Cron may already be deleted
      }
    }

    await ctx.scheduler.runAfter(
      0,
      internal.snapshotActions.deleteDaytonaSnapshot,
      { snapshotName: config.snapshotName, repoId: config.repoId },
    );

    await ctx.db.delete(args.repoSnapshotId);
    return null;
  },
});

export const triggerScheduledBuild = internalMutation({
  args: { repoSnapshotId: v.id("repoSnapshots") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const config = await ctx.db.get(args.repoSnapshotId);
    if (!config) return null;

    const runningBuild = await ctx.db
      .query("snapshotBuilds")
      .withIndex("by_repo_snapshot", (q) =>
        q.eq("repoSnapshotId", args.repoSnapshotId),
      )
      .order("desc")
      .first();

    if (runningBuild && runningBuild.status === "running") {
      if (Date.now() - runningBuild.startedAt > STALE_BUILD_MS) {
        await ctx.db.patch(runningBuild._id, {
          status: "error",
          error: "Build timed out (exceeded 20 minutes)",
          completedAt: Date.now(),
        });
      } else {
        return null;
      }
    }

    const now = Date.now();
    const buildId = await ctx.db.insert("snapshotBuilds", {
      repoSnapshotId: args.repoSnapshotId,
      status: "running",
      triggeredBy: "cron",
      logs: "",
      startedAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.snapshotActions.rebuildSnapshot, {
      buildId,
      repoSnapshotId: args.repoSnapshotId,
    });

    return null;
  },
});

export const startBuild = authMutation({
  args: { repoSnapshotId: v.id("repoSnapshots") },
  returns: v.id("snapshotBuilds"),
  handler: async (ctx, args) => {
    const config = await ctx.db.get(args.repoSnapshotId);
    if (!config) throw new Error("Snapshot config not found");

    const runningBuild = await ctx.db
      .query("snapshotBuilds")
      .withIndex("by_repo_snapshot", (q) =>
        q.eq("repoSnapshotId", args.repoSnapshotId),
      )
      .order("desc")
      .first();

    if (runningBuild && runningBuild.status === "running") {
      if (Date.now() - runningBuild.startedAt > STALE_BUILD_MS) {
        await ctx.db.patch(runningBuild._id, {
          status: "error",
          error: "Build timed out (exceeded 20 minutes)",
          completedAt: Date.now(),
        });
      } else {
        throw new Error("A build is already running for this snapshot");
      }
    }

    const now = Date.now();
    const buildId = await ctx.db.insert("snapshotBuilds", {
      repoSnapshotId: args.repoSnapshotId,
      status: "running",
      triggeredBy: "manual",
      logs: "",
      startedAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.snapshotActions.rebuildSnapshot, {
      buildId,
      repoSnapshotId: args.repoSnapshotId,
    });

    return buildId;
  },
});

export const completeBuild = internalMutation({
  args: {
    buildId: v.id("snapshotBuilds"),
    status: snapshotBuildStatusValidator,
    logs: v.string(),
    error: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const build = await ctx.db.get(args.buildId);
    if (!build) return null;
    await ctx.db.patch(args.buildId, {
      status: args.status,
      logs: build.logs + args.logs,
      error: args.error,
      completedAt: Date.now(),
    });
    if (args.status === "success") {
      const snapshot = await ctx.db.get(build.repoSnapshotId);
      if (snapshot) {
        await ctx.scheduler.runAfter(0, internal.daytona.warmSnapshotCache, {
          repoId: snapshot.repoId,
        });
      }
    }
    return null;
  },
});

export const appendLogs = internalMutation({
  args: {
    buildId: v.id("snapshotBuilds"),
    chunk: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const build = await ctx.db.get(args.buildId);
    if (!build) return null;
    await ctx.db.patch(args.buildId, {
      logs: build.logs + args.chunk,
    });
    return null;
  },
});

export const setWorkflowRunId = internalMutation({
  args: {
    buildId: v.id("snapshotBuilds"),
    workflowRunId: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.buildId, {
      workflowRunId: args.workflowRunId,
    });
    return null;
  },
});

export const getRepoSnapshotInternal = internalQuery({
  args: { repoSnapshotId: v.id("repoSnapshots") },
  returns: v.union(
    v.object({
      repoId: v.id("githubRepos"),
      snapshotName: v.string(),
      workflowRef: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.repoSnapshotId);
    if (!doc) return null;
    return {
      repoId: doc.repoId,
      snapshotName: doc.snapshotName,
      workflowRef: doc.workflowRef,
    };
  },
});

export const getRepo = internalQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.union(
    v.object({
      owner: v.string(),
      name: v.string(),
      installationId: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const repo = await ctx.db.get(args.repoId);
    if (!repo) return null;
    return {
      owner: repo.owner,
      name: repo.name,
      installationId: repo.installationId,
    };
  },
});
