import { v } from "convex/values";
import { authQuery, authMutation, hasRepoAccess } from "../functions";
import { allocateNumId, filterActiveEntities } from "../numId";
import type { DatabaseReader, DatabaseWriter } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { getSystemAutomation, SYSTEM_AUTOMATIONS } from "./systemAutomations";

/** Catalog entry joined with this repo's install state, for the Automations Hub. */
const systemAutomationEntry = v.object({
  key: v.string(),
  title: v.string(),
  description: v.string(),
  cronSchedule: v.string(),
  /** True while an install row exists for this repo (soft-deleted ones don't count). */
  installed: v.boolean(),
  enabled: v.boolean(),
  sendEmail: v.boolean(),
  /** Per-repo URL id of the install row, or null when not installed. */
  numId: v.union(v.number(), v.null()),
});

/**
 * Finds this repo's install row for a catalog key. Returns soft-deleted rows
 * too, so reinstalling revives the original row and keeps its run history.
 */
async function findInstall(
  db: DatabaseReader,
  repoId: Id<"githubRepos">,
  key: string,
): Promise<Doc<"automations"> | null> {
  const rows = await db
    .query("automations")
    .withIndex("by_repo", (q) => q.eq("repoId", repoId))
    .collect();
  const matches = rows.filter((row) => row.systemKey === key);
  return (
    filterActiveEntities(matches)[0] ??
    matches.find((row) => row.deletedAt !== undefined) ??
    null
  );
}

/** Lists the hardcoded system automations with this repo's install state. */
export const listSystemAutomations = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(systemAutomationEntry),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) {
      return [];
    }
    const rows = filterActiveEntities(
      await ctx.db
        .query("automations")
        .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
        .collect(),
    );

    return SYSTEM_AUTOMATIONS.map((entry) => {
      const install = rows.find((row) => row.systemKey === entry.key);
      return {
        key: entry.key,
        title: entry.title,
        description: entry.description,
        cronSchedule: entry.cronSchedule,
        installed: install !== undefined,
        enabled: install?.enabled === true,
        sendEmail: install?.sendEmail === true,
        numId: install?.numId ?? null,
      };
    });
  },
});

/** Resolves the repo + catalog entry for a Hub mutation, or throws. */
async function authorizeInstall(
  db: DatabaseWriter,
  userId: Id<"users">,
  repoId: Id<"githubRepos">,
  key: string,
) {
  if (!(await hasRepoAccess(db, repoId, userId))) {
    throw new Error("Not authorized");
  }
  const entry = getSystemAutomation(key);
  if (!entry) throw new Error("Unknown system automation");
  return entry;
}

/**
 * Installs a system automation into a repo: creates the install row (or revives
 * a previously uninstalled one, keeping its run history) and switches it on.
 * No cron is registered — crons.ts fans out to every enabled install per entry.
 */
export const installSystemAutomation = authMutation({
  args: { repoId: v.id("githubRepos"), key: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const entry = await authorizeInstall(
      ctx.db,
      ctx.userId,
      args.repoId,
      args.key,
    );
    const now = Date.now();
    const existing = await findInstall(ctx.db, args.repoId, args.key);
    if (existing) {
      await ctx.db.patch(existing._id, {
        deletedAt: undefined,
        enabled: true,
        updatedAt: now,
      });
      return null;
    }

    // Content fields stay empty: the catalog supplies title/prompt/schedule on
    // read. `title` is denormalised only as a fallback if the entry is removed.
    const numId = await allocateNumId(ctx.db, args.repoId, "automations");
    await ctx.db.insert("automations", {
      repoId: args.repoId,
      systemKey: entry.key,
      title: entry.title,
      description: "",
      cronSchedule: "",
      enabled: true,
      createdBy: ctx.userId,
      createdAt: now,
      updatedAt: now,
      numId,
    });
    return null;
  },
});

/**
 * Uninstalls a system automation from a repo. Soft-deletes the install row, so
 * it drops out of the sidebar and the schedule fan-out but reinstalling later
 * brings the same row — and its runs — back.
 */
export const uninstallSystemAutomation = authMutation({
  args: { repoId: v.id("githubRepos"), key: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await authorizeInstall(ctx.db, ctx.userId, args.repoId, args.key);
    const install = await findInstall(ctx.db, args.repoId, args.key);
    if (!install || install.deletedAt !== undefined) return null;

    const now = Date.now();
    await ctx.db.patch(install._id, {
      enabled: false,
      deletedAt: now,
      updatedAt: now,
    });
    return null;
  },
});
