import { v } from "convex/values";
import { internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import type { GenericDatabaseReader } from "convex/server";
import type { DataModel, Doc, Id } from "../_generated/dataModel";
import { snapshotScheduleValidator } from "../validators";
import { authQuery, authMutation } from "../functions";
import { safeDeleteCron, safeReplaceCron } from "../cronManager";

/** Converts a schedule string to a cron expression, returning null for "manual". */
function resolveCronspec(schedule: string): string | null {
  if (schedule === "manual") return null;
  return schedule;
}

/** Finds a snapshot config for a repo, checking sibling repos with the same owner/name if needed. */
export async function findSnapshotForRepo(
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

/** Retrieves the snapshot configuration for a repo, falling back to sibling repos. */
export const getRepoSnapshot = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.union(
    v.object({
      _id: v.id("repoSnapshots"),
      _creationTime: v.number(),
      repoId: v.id("githubRepos"),
      snapshotName: v.string(),
      schedule: snapshotScheduleValidator,
      enabled: v.optional(v.boolean()),
      cronJobId: v.optional(v.string()),
      workflowRef: v.optional(v.string()),
      buildCommands: v.optional(v.array(v.string())),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await findSnapshotForRepo(ctx.db, args.repoId);
  },
});

/** Returns the snapshot name for a repo, only if a successful build exists. */
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

/** Internal query to get snapshot config fields needed for rebuild actions. */
export const getRepoSnapshotInternal = internalQuery({
  args: { repoSnapshotId: v.id("repoSnapshots") },
  returns: v.union(
    v.object({
      repoId: v.id("githubRepos"),
      snapshotName: v.string(),
      workflowRef: v.optional(v.string()),
      buildCommands: v.optional(v.array(v.string())),
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
      buildCommands: doc.buildCommands,
    };
  },
});

/** Creates or updates a snapshot config for a repo, managing the associated cron job. */
export const saveRepoSnapshot = authMutation({
  args: {
    repoId: v.id("githubRepos"),
    schedule: snapshotScheduleValidator,
    workflowRef: v.optional(v.string()),
    buildCommands: v.optional(v.array(v.string())),
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
      const cronspec = resolveCronspec(args.schedule);
      const cronJobId = await safeReplaceCron(ctx, {
        name: cronName,
        existingCronJobId: existing.cronJobId,
        cronspec: cronspec && existing.enabled === true ? cronspec : null,
        handler: internal.repoSnapshots.triggerScheduledBuild,
        args: { repoSnapshotId: existing._id },
      });

      await ctx.db.patch(existing._id, {
        schedule: args.schedule,
        cronJobId,
        workflowRef: args.workflowRef,
        buildCommands: args.buildCommands,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    const now = Date.now();
    const id = await ctx.db.insert("repoSnapshots", {
      repoId: canonicalRepoId,
      snapshotName,
      schedule: args.schedule,
      enabled: true,
      workflowRef: args.workflowRef,
      buildCommands: args.buildCommands,
      createdAt: now,
      updatedAt: now,
    });

    const cronJobId = await safeReplaceCron(ctx, {
      name: cronName,
      existingCronJobId: undefined,
      cronspec: resolveCronspec(args.schedule),
      handler: internal.repoSnapshots.triggerScheduledBuild,
      args: { repoSnapshotId: id },
    });
    if (cronJobId) {
      await ctx.db.patch(id, { cronJobId });
    }

    return id;
  },
});

/** Toggles the enabled state of a snapshot, registering or deleting the cron job. */
export const setSnapshotEnabled = authMutation({
  args: {
    repoSnapshotId: v.id("repoSnapshots"),
    enabled: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const config = await ctx.db.get(args.repoSnapshotId);
    if (!config) throw new Error("Snapshot config not found");

    const cronName = `snapshot-rebuild-${config.repoId}`;
    const cronJobId = await safeReplaceCron(ctx, {
      name: cronName,
      existingCronJobId: config.cronJobId,
      cronspec: args.enabled ? resolveCronspec(config.schedule) : null,
      handler: internal.repoSnapshots.triggerScheduledBuild,
      args: { repoSnapshotId: config._id },
    });

    await ctx.db.patch(args.repoSnapshotId, {
      enabled: args.enabled,
      cronJobId,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/** Deletes a snapshot config, its cron job, and the remote Daytona snapshot. */
export const deleteRepoSnapshot = authMutation({
  args: { repoSnapshotId: v.id("repoSnapshots") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const config = await ctx.db.get(args.repoSnapshotId);
    if (!config) return null;

    const cronName = `snapshot-rebuild-${config.repoId}`;
    await safeDeleteCron(ctx, cronName, config.cronJobId);

    await ctx.scheduler.runAfter(
      0,
      internal.snapshotActions.deleteDaytonaSnapshot,
      { snapshotName: config.snapshotName, repoId: config.repoId },
    );

    await ctx.db.delete(args.repoSnapshotId);
    return null;
  },
});
