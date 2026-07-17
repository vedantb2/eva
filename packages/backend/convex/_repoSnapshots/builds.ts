import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  type MutationCtx,
} from "../_generated/server";
import { internal } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import {
  snapshotBuildStatusValidator,
  snapshotBuildTriggerValidator,
  snapshotBuildKindValidator,
  sandboxProviderKindValidator,
  seededAppResultValidator,
  seededAppStatusValidator,
} from "../validators";
import { authQuery, authMutation } from "../functions";
import { workflow } from "../workflowManager";

const STALE_BUILD_MS = 30 * 60 * 1000;
const MAX_CRON_RETRIES = 2;

/**
 * Resolves whether a build seeds a DB or only rebuilds the base Image.
 * An app seeds iff it has Stop Commands; otherwise the workflow can only
 * rebuild the base Image. forceImageRebuild does not change this — it just
 * refreshes the base before the same seed path runs.
 */
async function resolveBuildKind(
  ctx: {
    db: { get: (id: Id<"githubRepos">) => Promise<Doc<"githubRepos"> | null> };
  },
  repoId: Id<"githubRepos">,
): Promise<"base" | "seeded"> {
  const repo = await ctx.db.get(repoId);
  return (repo?.stopCommands?.length ?? 0) > 0 ? "seeded" : "base";
}

/**
 * If a build is currently running for a snapshot, either expire it (when stale)
 * or report it as blocking. Returns true only when a non-stale build is still
 * running, in which case the caller must not start a new build.
 */
async function expireStaleBuild(
  ctx: MutationCtx,
  runningBuild: Doc<"snapshotBuilds"> | null,
): Promise<boolean> {
  if (!runningBuild || runningBuild.status !== "running") return false;
  if (Date.now() - runningBuild.startedAt > STALE_BUILD_MS) {
    await ctx.db.patch(runningBuild._id, {
      status: "error",
      error: "Build timed out (exceeded 20 minutes)",
      completedAt: Date.now(),
    });
    return false;
  }
  return true;
}

type SeededAppReturn = {
  repoId: Id<"githubRepos">;
  seededSnapshotName: string | null;
  app?: string;
  status?: "running" | "seeded" | "fallback";
};

/** Drops legacy warmup fields still present on older prod rows. */
function sanitizeSeededApps(
  seededApps: Doc<"snapshotBuilds">["seededApps"],
): SeededAppReturn[] | undefined {
  if (seededApps === undefined) {
    return undefined;
  }
  return seededApps.map((app) => {
    const cleaned: SeededAppReturn = {
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
  });
}

function sanitizeBuildForReturn(build: Doc<"snapshotBuilds">) {
  return {
    ...build,
    seededApps: sanitizeSeededApps(build.seededApps),
  };
}

/**
 * Provider for display: persisted on the build when possible. Legacy rows and
 * builds still running infer from log markers (env vars are encrypted and
 * cannot be read in query handlers).
 */
function resolveBuildProvider(
  build: Doc<"snapshotBuilds">,
): "vercel" | "daytona" {
  if (build.provider) {
    return build.provider;
  }
  if (build.logs.includes("Vercel base Image")) {
    return "vercel";
  }
  if (build.logs.includes("Starting Daytona snapshot build")) {
    return "daytona";
  }
  // Vercel captures return snap_* ids; Daytona seeded snapshots use seeded-<repoId>.
  if (build.logs.includes("snap_")) {
    return "vercel";
  }
  const seededApps = build.seededApps ?? [];
  if (seededApps.some((app) => app.seededSnapshotName?.startsWith("snap_"))) {
    return "vercel";
  }
  if (seededApps.some((app) => app.seededSnapshotName?.startsWith("seeded-"))) {
    return "daytona";
  }
  return "daytona";
}

/** Persists the sandbox provider at workflow start (requires action to decrypt env). */
export const setBuildProvider = internalMutation({
  args: {
    buildId: v.id("snapshotBuilds"),
    provider: sandboxProviderKindValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const build = await ctx.db.get(args.buildId);
    if (!build) return null;
    await ctx.db.patch(args.buildId, { provider: args.provider });
    return null;
  },
});

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
      kind: v.optional(snapshotBuildKindValidator),
      provider: sandboxProviderKindValidator,
      logs: v.string(),
      error: v.optional(v.string()),
      workflowRunId: v.optional(v.number()),
      startedAt: v.number(),
      completedAt: v.optional(v.number()),
      retryCount: v.optional(v.number()),
      seededApps: v.optional(v.array(seededAppResultValidator)),
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
    return builds.map((build) => ({
      ...sanitizeBuildForReturn(build),
      provider: resolveBuildProvider(build),
    }));
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
      kind: v.optional(snapshotBuildKindValidator),
      provider: sandboxProviderKindValidator,
      logs: v.string(),
      error: v.optional(v.string()),
      workflowRunId: v.optional(v.number()),
      startedAt: v.number(),
      completedAt: v.optional(v.number()),
      retryCount: v.optional(v.number()),
      seededApps: v.optional(v.array(seededAppResultValidator)),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const build = await ctx.db.get(args.buildId);
    if (!build) {
      return null;
    }
    return {
      ...sanitizeBuildForReturn(build),
      provider: resolveBuildProvider(build),
    };
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
  args: {
    repoSnapshotId: v.id("repoSnapshots"),
    // For operational debugging: keep the existing cron entry point but record
    // the build as manual so completeBuild does not enqueue cron retries.
    disableRetries: v.optional(v.boolean()),
    forceImageRebuild: v.optional(v.boolean()),
    forceBaseSeed: v.optional(v.boolean()),
  },
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

    if (await expireStaleBuild(ctx, runningBuild)) return null;

    const now = Date.now();
    const kind = await resolveBuildKind(ctx, config.repoId);
    const buildId = await ctx.db.insert("snapshotBuilds", {
      repoSnapshotId: args.repoSnapshotId,
      status: "running",
      triggeredBy: args.disableRetries === true ? "manual" : "cron",
      kind,
      logs: "",
      startedAt: now,
    });

    await workflow.start(ctx, internal.snapshotWorkflow.snapshotBuildWorkflow, {
      buildId,
      repoSnapshotId: args.repoSnapshotId,
      forceImageRebuild: args.forceImageRebuild,
      forceBaseSeed: args.forceBaseSeed,
    });

    return null;
  },
});

/**
 * Internal: all sandbox ids with a real product owner. Credential-helper rows
 * are intentionally excluded: they are implementation detail rows created for
 * every sandbox, including leaked seed-prep sandboxes.
 */
export const listReferencedSandboxIds = internalQuery({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const ids: string[] = [];
    const add = (sandboxId: string | undefined): void => {
      if (sandboxId && !ids.includes(sandboxId)) ids.push(sandboxId);
    };

    const tasks = await ctx.db.query("agentTasks").collect();
    for (const task of tasks) add(task.sandboxId);

    const runs = await ctx.db.query("agentRuns").collect();
    for (const run of runs) add(run.sandboxId);

    const sessions = await ctx.db.query("sessions").collect();
    for (const session of sessions) add(session.sandboxId);

    const projects = await ctx.db.query("projects").collect();
    for (const project of projects) add(project.sandboxId);

    const designSessions = await ctx.db.query("designSessions").collect();
    for (const session of designSessions) add(session.sandboxId);

    const docs = await ctx.db.query("docs").collect();
    for (const doc of docs) add(doc.sandboxId);

    const automationRuns = await ctx.db.query("automationRuns").collect();
    for (const run of automationRuns) add(run.sandboxId);

    return ids;
  },
});

/** Manually starts a new snapshot build, failing if one is already running. */
export const startBuild = authMutation({
  args: {
    repoSnapshotId: v.id("repoSnapshots"),
    /** App repo that triggered the build (for shared monorepo snapshot configs). */
    appRepoId: v.optional(v.id("githubRepos")),
  },
  returns: v.id("snapshotBuilds"),
  handler: async (ctx, args) => {
    const sharedConfig = await ctx.db.get(args.repoSnapshotId);
    if (!sharedConfig) throw new Error("Snapshot config not found");

    // Lazy-migrate shared monorepo configs onto the triggering app so
    // eprocurement builds don't share history / baseSnapshotId with apps/web.
    let config = sharedConfig;
    const effectiveAppRepoId = args.appRepoId ?? sharedConfig.repoId;
    if (effectiveAppRepoId !== sharedConfig.repoId) {
      const appSpecific = await ctx.db
        .query("repoSnapshots")
        .withIndex("by_repo", (q) => q.eq("repoId", effectiveAppRepoId))
        .first();
      if (appSpecific) {
        config = appSpecific;
      } else {
        const now = Date.now();
        const id = await ctx.db.insert("repoSnapshots", {
          repoId: effectiveAppRepoId,
          snapshotName: `snapshot-${effectiveAppRepoId}`,
          schedule: sharedConfig.schedule,
          enabled: sharedConfig.enabled ?? true,
          workflowRef: sharedConfig.workflowRef,
          buildCommands: sharedConfig.buildCommands,
          // Do not copy baseSnapshotId — that may be another app's Vercel snap.
          createdAt: now,
          updatedAt: now,
        });
        const created = await ctx.db.get(id);
        if (!created) throw new Error("Failed to create app snapshot config");
        config = created;
      }
    }

    const runningBuild = await ctx.db
      .query("snapshotBuilds")
      .withIndex("by_repo_snapshot", (q) => q.eq("repoSnapshotId", config._id))
      .order("desc")
      .first();

    if (await expireStaleBuild(ctx, runningBuild)) {
      throw new Error("A build is already running for this snapshot");
    }

    const now = Date.now();
    const kind = await resolveBuildKind(ctx, effectiveAppRepoId);
    const buildId = await ctx.db.insert("snapshotBuilds", {
      repoSnapshotId: config._id,
      status: "running",
      triggeredBy: "manual",
      kind,
      logs: "",
      startedAt: now,
    });

    await workflow.start(ctx, internal.snapshotWorkflow.snapshotBuildWorkflow, {
      buildId,
      repoSnapshotId: config._id,
      appRepoId: effectiveAppRepoId,
    });

    return buildId;
  },
});

/**
 * Internal entry for ops / agent loops: start a snapshot build for a specific
 * app repo (creates a per-app config from a shared monorepo config if needed).
 */
export const startBuildForRepo = internalMutation({
  args: { repoId: v.id("githubRepos") },
  returns: v.id("snapshotBuilds"),
  handler: async (ctx, args) => {
    const appSpecific = await ctx.db
      .query("repoSnapshots")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .first();

    let repoSnapshotId = appSpecific?._id;
    if (!repoSnapshotId) {
      const repo = await ctx.db.get(args.repoId);
      if (!repo) throw new Error("Repo not found");
      const siblings = await ctx.db
        .query("githubRepos")
        .withIndex("by_owner_and_name", (q) =>
          q.eq("owner", repo.owner).eq("name", repo.name),
        )
        .collect();
      let shared: Doc<"repoSnapshots"> | null = null;
      for (const sibling of siblings) {
        if (sibling._id === args.repoId) continue;
        const siblingSnapshot = await ctx.db
          .query("repoSnapshots")
          .withIndex("by_repo", (q) => q.eq("repoId", sibling._id))
          .first();
        if (siblingSnapshot) {
          shared = siblingSnapshot;
          break;
        }
      }
      if (!shared) throw new Error("No snapshot config found for this repo");
      const now = Date.now();
      repoSnapshotId = await ctx.db.insert("repoSnapshots", {
        repoId: args.repoId,
        snapshotName: `snapshot-${args.repoId}`,
        schedule: shared.schedule,
        enabled: shared.enabled ?? true,
        workflowRef: shared.workflowRef,
        buildCommands: shared.buildCommands,
        createdAt: now,
        updatedAt: now,
      });
    }

    const runningBuild = await ctx.db
      .query("snapshotBuilds")
      .withIndex("by_repo_snapshot", (q) =>
        q.eq("repoSnapshotId", repoSnapshotId),
      )
      .order("desc")
      .first();
    if (await expireStaleBuild(ctx, runningBuild)) {
      throw new Error("A build is already running for this snapshot");
    }

    const now = Date.now();
    const kind = await resolveBuildKind(ctx, args.repoId);
    const buildId = await ctx.db.insert("snapshotBuilds", {
      repoSnapshotId,
      status: "running",
      triggeredBy: "manual",
      kind,
      logs: "",
      startedAt: now,
    });

    await workflow.start(ctx, internal.snapshotWorkflow.snapshotBuildWorkflow, {
      buildId,
      repoSnapshotId,
      appRepoId: args.repoId,
    });

    return buildId;
  },
});

/** Marks a build as complete (success/error); retries on cron failure. */
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
        kind: build.kind,
        provider: build.provider,
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

/**
 * Records a single app's seeding outcome on a build (called during Step 5).
 * seededSnapshotName is the captured snapshot name on success, or null when the
 * app fell back to the base Image. Replaces any prior entry for the same repo so
 * the operation is idempotent under workflow retries.
 */
export const recordSeededApp = internalMutation({
  args: {
    buildId: v.id("snapshotBuilds"),
    repoId: v.id("githubRepos"),
    status: seededAppStatusValidator,
    seededSnapshotName: v.union(v.string(), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const build = await ctx.db.get(args.buildId);
    if (!build) return null;
    const repo = await ctx.db.get(args.repoId);
    const seededApps = [
      ...(build.seededApps ?? []).filter((a) => a.repoId !== args.repoId),
      {
        repoId: args.repoId,
        app: repo?.rootDirectory,
        status: args.status,
        seededSnapshotName: args.seededSnapshotName,
      },
    ];
    await ctx.db.patch(args.buildId, { seededApps });
    return null;
  },
});
