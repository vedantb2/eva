import { v } from "convex/values";
import { authQuery, authMutation, hasRepoAccess } from "../functions";
import { allocateNumId, filterActiveEntities } from "../numId";
import { getSystemAutomation, SYSTEM_AUTOMATIONS } from "./systemAutomations";

/** Catalog entry joined with this repo's install state, for the Automations Hub. */
const systemAutomationEntry = v.object({
  key: v.string(),
  title: v.string(),
  description: v.string(),
  cronSchedule: v.string(),
  enabled: v.boolean(),
  sendEmail: v.boolean(),
  /** Per-repo URL id of the install row, or null when never enabled. */
  numId: v.union(v.number(), v.null()),
});

/** Lists the hardcoded system automations with this repo's enable state. */
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
        enabled: install?.enabled === true,
        sendEmail: install?.sendEmail === true,
        numId: install?.numId ?? null,
      };
    });
  },
});

/**
 * Toggles a system automation for a repo, creating the install row on first
 * enable. Disabling keeps the row so its run history survives. No cron is
 * registered here — crons.ts fans out to every enabled install per catalog entry.
 */
export const setSystemAutomationState = authMutation({
  args: {
    repoId: v.id("githubRepos"),
    key: v.string(),
    enabled: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    const entry = getSystemAutomation(args.key);
    if (!entry) throw new Error("Unknown system automation");

    const rows = filterActiveEntities(
      await ctx.db
        .query("automations")
        .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
        .collect(),
    );
    const install = rows.find((row) => row.systemKey === args.key);

    const now = Date.now();
    if (install) {
      await ctx.db.patch(install._id, { enabled: args.enabled, updatedAt: now });
      return null;
    }
    if (!args.enabled) return null;

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
