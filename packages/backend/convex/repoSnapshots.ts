import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { components } from "./_generated/api";
import { Crons } from "@convex-dev/crons";
import { getCurrentUserId } from "./auth";
import {
  snapshotScheduleValidator,
  snapshotBuildStatusValidator,
  snapshotBuildTriggerValidator,
} from "./validators";

const crons = new Crons(components.crons);

const SCHEDULE_INTERVALS: Record<string, number> = {
  daily: 86400000,
  every_3_days: 259200000,
  weekly: 604800000,
};

const STALE_BUILD_MS = 20 * 60 * 1000;

export const getRepoSnapshot = query({
  args: { repoId: v.id("githubRepos") },
  returns: v.union(
    v.object({
      _id: v.id("repoSnapshots"),
      _creationTime: v.number(),
      repoId: v.id("githubRepos"),
      snapshotName: v.string(),
      schedule: snapshotScheduleValidator,
      cronJobId: v.optional(v.string()),
      customSetupCommands: v.array(v.string()),
      customEnvVars: v.array(v.object({ key: v.string(), value: v.string() })),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) return null;
    return await ctx.db
      .query("repoSnapshots")
      .withIndex("by_repoId", (q) => q.eq("repoId", args.repoId))
      .first();
  },
});

export const getRepoSnapshotName = internalQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.union(v.object({ snapshotName: v.string() }), v.null()),
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("repoSnapshots")
      .withIndex("by_repoId", (q) => q.eq("repoId", args.repoId))
      .first();
    if (!doc) return null;
    return { snapshotName: doc.snapshotName };
  },
});

export const listBuilds = query({
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
    const userId = await getCurrentUserId(ctx);
    if (!userId) return [];
    const builds = await ctx.db
      .query("snapshotBuilds")
      .withIndex("by_repoSnapshotId", (q) =>
        q.eq("repoSnapshotId", args.repoSnapshotId),
      )
      .order("desc")
      .take(20);
    return builds;
  },
});

export const getBuild = query({
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
    const userId = await getCurrentUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(args.buildId);
  },
});

export const saveRepoSnapshot = mutation({
  args: {
    repoId: v.id("githubRepos"),
    schedule: snapshotScheduleValidator,
    customSetupCommands: v.array(v.string()),
    customEnvVars: v.array(v.object({ key: v.string(), value: v.string() })),
  },
  returns: v.id("repoSnapshots"),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("repoSnapshots")
      .withIndex("by_repoId", (q) => q.eq("repoId", args.repoId))
      .first();

    const cronName = `snapshot-rebuild-${args.repoId}`;
    const snapshotName = existing
      ? existing.snapshotName
      : `snapshot-${args.repoId}`;

    if (existing) {
      if (existing.cronJobId) {
        try {
          await crons.delete(ctx, { name: cronName });
        } catch {
          // Cron may already be deleted
        }
      }

      let cronJobId: string | undefined;
      if (args.schedule !== "manual") {
        const ms = SCHEDULE_INTERVALS[args.schedule];
        if (ms) {
          const id = await crons.register(
            ctx,
            { kind: "interval", ms },
            internal.repoSnapshots.triggerScheduledBuild,
            { repoSnapshotId: existing._id },
            cronName,
          );
          cronJobId = String(id);
        }
      }

      await ctx.db.patch(existing._id, {
        schedule: args.schedule,
        cronJobId,
        customSetupCommands: args.customSetupCommands,
        customEnvVars: args.customEnvVars,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    const now = Date.now();
    const id = await ctx.db.insert("repoSnapshots", {
      repoId: args.repoId,
      snapshotName,
      schedule: args.schedule,
      customSetupCommands: args.customSetupCommands,
      customEnvVars: args.customEnvVars,
      createdAt: now,
      updatedAt: now,
    });

    if (args.schedule !== "manual") {
      const ms = SCHEDULE_INTERVALS[args.schedule];
      if (ms) {
        const cronId = await crons.register(
          ctx,
          { kind: "interval", ms },
          internal.repoSnapshots.triggerScheduledBuild,
          { repoSnapshotId: id },
          cronName,
        );
        await ctx.db.patch(id, { cronJobId: String(cronId) });
      }
    }

    return id;
  },
});

export const deleteRepoSnapshot = mutation({
  args: { repoSnapshotId: v.id("repoSnapshots") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

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
      { snapshotName: config.snapshotName },
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
      .withIndex("by_repoSnapshotId", (q) =>
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

export const startBuild = mutation({
  args: { repoSnapshotId: v.id("repoSnapshots") },
  returns: v.id("snapshotBuilds"),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const config = await ctx.db.get(args.repoSnapshotId);
    if (!config) throw new Error("Snapshot config not found");

    const runningBuild = await ctx.db
      .query("snapshotBuilds")
      .withIndex("by_repoSnapshotId", (q) =>
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
      customSetupCommands: v.array(v.string()),
      customEnvVars: v.array(v.object({ key: v.string(), value: v.string() })),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.repoSnapshotId);
    if (!doc) return null;
    return {
      repoId: doc.repoId,
      snapshotName: doc.snapshotName,
      customSetupCommands: doc.customSetupCommands,
      customEnvVars: doc.customEnvVars,
    };
  },
});

export const getRepo = internalQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.union(
    v.object({
      owner: v.string(),
      name: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const repo = await ctx.db.get(args.repoId);
    if (!repo) return null;
    return { owner: repo.owner, name: repo.name };
  },
});
