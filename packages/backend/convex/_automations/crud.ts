import { v } from "convex/values";
import { internal } from "../_generated/api";
import { aiModelValidator, automationFields } from "../validators";
import { authQuery, authMutation, hasRepoAccess } from "../functions";
import { safeDeleteCron, safeReplaceCron } from "../cronManager";
import type { Doc } from "../_generated/dataModel";

/** Lists all automations for a given repository. */
export const list = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(
    v.object({
      _id: v.id("automations"),
      _creationTime: v.number(),
      ...automationFields,
    }),
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("automations")
      .withIndex("by_repo", (q) => q.eq("repoId", args.repoId))
      .collect();
  },
});

/** Returns a single automation by ID. */
export const get = authQuery({
  args: { id: v.id("automations") },
  returns: v.union(
    v.object({
      _id: v.id("automations"),
      _creationTime: v.number(),
      ...automationFields,
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/** Creates a new automation for a repository with default disabled state. */
export const create = authMutation({
  args: {
    repoId: v.id("githubRepos"),
    title: v.string(),
  },
  returns: v.id("automations"),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    const now = Date.now();
    return await ctx.db.insert("automations", {
      repoId: args.repoId,
      title: args.title,
      description: "",
      cronSchedule: "",
      enabled: false,
      createdBy: ctx.userId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/** Updates automation fields and syncs the cron schedule (re-registers or deletes as needed). */
export const update = authMutation({
  args: {
    id: v.id("automations"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    cronSchedule: v.optional(v.string()),
    model: v.optional(aiModelValidator),
    enabled: v.optional(v.boolean()),
    readOnly: v.optional(v.boolean()),
    actionsEnabled: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const automation = await ctx.db.get(args.id);
    if (!automation) throw new Error("Automation not found");
    if (!(await hasRepoAccess(ctx.db, automation.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }

    const patch: Partial<Doc<"automations">> = { updatedAt: Date.now() };
    if (args.title !== undefined) patch.title = args.title;
    if (args.description !== undefined) patch.description = args.description;
    if (args.cronSchedule !== undefined) patch.cronSchedule = args.cronSchedule;
    if (args.model !== undefined) patch.model = args.model;
    if (args.enabled !== undefined) patch.enabled = args.enabled;
    if (args.readOnly !== undefined) patch.readOnly = args.readOnly;
    if (args.actionsEnabled !== undefined)
      patch.actionsEnabled = args.actionsEnabled;

    const newSchedule = args.cronSchedule ?? automation.cronSchedule;
    const newEnabled =
      args.enabled !== undefined ? args.enabled : automation.enabled;

    const cronName = `automation-${String(args.id)}`;
    patch.cronJobId = await safeReplaceCron(ctx, {
      name: cronName,
      existingCronJobId: automation.cronJobId,
      cronspec: newEnabled && newSchedule ? newSchedule : null,
      handler: internal.automations.triggerAutomation,
      args: { automationId: args.id },
    });

    await ctx.db.patch(args.id, patch);
    return null;
  },
});

/** Deletes an automation, its cron job, and all associated runs. */
export const remove = authMutation({
  args: { id: v.id("automations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const automation = await ctx.db.get(args.id);
    if (!automation) return null;
    if (!(await hasRepoAccess(ctx.db, automation.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }

    const cronName = `automation-${String(args.id)}`;
    await safeDeleteCron(ctx, cronName, automation.cronJobId);

    const runs = await ctx.db
      .query("automationRuns")
      .withIndex("by_automation", (q) => q.eq("automationId", args.id))
      .collect();
    for (const run of runs) {
      await ctx.db.delete(run._id);
    }

    await ctx.db.delete(args.id);
    return null;
  },
});
