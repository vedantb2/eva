import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import {
  snapshotBuildStatusValidator,
  snapshotBuildTriggerValidator,
  snapshotWarmupStatusValidator,
} from "../validators";
import { authQuery, authMutation } from "../functions";
import { workflow } from "../workflowManager";

const STALE_BUILD_MS = 30 * 60 * 1000;
const MAX_CRON_RETRIES = 2;

/** Lists the most recent 20 snapshot builds for a given snapshot config. */
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
      retryCount: v.optional(v.number()),
      warmupStatus: v.optional(snapshotWarmupStatusValidator),
      warmupError: v.optional(v.string()),
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

/** Retrieves a single snapshot build by ID. */
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
      retryCount: v.optional(v.number()),
      warmupStatus: v.optional(snapshotWarmupStatusValidator),
      warmupError: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.buildId);
  },
});

/** Returns just the build status, used by the safety-net poller to avoid double-completing. */
export const getBuildStatus = internalQuery({
  args: { buildId: v.id("snapshotBuilds") },
  returns: v.union(snapshotBuildStatusValidator, v.null()),
  handler: async (ctx, args) => {
    const build = await ctx.db.get(args.buildId);
    if (!build) return null;
    return build.status;
  },
});

/** Cron-triggered handler that starts a new snapshot build if none is currently running. */
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

    await workflow.start(ctx, internal.snapshotWorkflow.snapshotBuildWorkflow, {
      buildId,
      repoSnapshotId: args.repoSnapshotId,
    });

    return null;
  },
});

/** Manually starts a new snapshot build, failing if one is already running. */
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

    await workflow.start(ctx, internal.snapshotWorkflow.snapshotBuildWorkflow, {
      buildId,
      repoSnapshotId: args.repoSnapshotId,
    });

    return buildId;
  },
});

/** Marks a build as complete (success/error), triggers warmup on success or retries on cron failure. */
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

    // Guard: prevent double-completion from concurrent workflow steps
    if (build.status !== "running") return null;

    await ctx.db.patch(args.buildId, {
      status: args.status,
      logs: build.logs + args.logs,
      error: args.error,
      completedAt: Date.now(),
    });
    if (args.status === "success") {
      const snapshot = await ctx.db.get(build.repoSnapshotId);
      if (snapshot) {
        await ctx.db.patch(args.buildId, { warmupStatus: "pending" });
        await ctx.scheduler.runAfter(0, internal.daytona.warmSnapshotCache, {
          repoId: snapshot.repoId,
          buildId: args.buildId,
        });
      }
    }
    if (
      args.status === "error" &&
      build.triggeredBy === "cron" &&
      (build.retryCount ?? 0) < MAX_CRON_RETRIES
    ) {
      const retryCount = (build.retryCount ?? 0) + 1;
      const now = Date.now();
      const retryBuildId = await ctx.db.insert("snapshotBuilds", {
        repoSnapshotId: build.repoSnapshotId,
        status: "running",
        triggeredBy: "cron",
        logs: `Retry ${retryCount}/${MAX_CRON_RETRIES} after failure: ${args.error ?? "unknown error"}\n`,
        startedAt: now,
        retryCount,
      });
      await workflow.start(
        ctx,
        internal.snapshotWorkflow.snapshotBuildWorkflow,
        {
          buildId: retryBuildId,
          repoSnapshotId: build.repoSnapshotId,
        },
      );
    }
    return null;
  },
});

/** Updates the warmup status and optional error for a snapshot build. */
export const updateWarmupStatus = internalMutation({
  args: {
    buildId: v.id("snapshotBuilds"),
    status: snapshotWarmupStatusValidator,
    error: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const build = await ctx.db.get(args.buildId);
    if (!build) return null;
    await ctx.db.patch(args.buildId, {
      warmupStatus: args.status,
      warmupError: args.error,
    });
    return null;
  },
});

/** Appends a log chunk to an existing snapshot build record. */
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
