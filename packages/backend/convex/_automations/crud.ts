import { v } from "convex/values";
import { internal } from "../_generated/api";
import { aiModelValidator, automationFields } from "../validators";
import { authQuery, authMutation, hasRepoAccess } from "../functions";
import { allocateNumId, entityVisible } from "../numId";
import { safeDeleteCron, safeReplaceCron } from "../cronManager";
import type { Doc } from "../_generated/dataModel";
import { listAutomationsForRepo, resolveAutomationRepoId } from "./helpers";
import { resolveCanonicalRepoId } from "../_githubRepos/helpers";
import { resolveAutomationDoc } from "./systemAutomations";

/** Return validator for a full automation document. */
const automationDoc = v.object({
  _id: v.id("automations"),
  _creationTime: v.number(),
  ...automationFields,
});

/** Hides soft-deleted rows and applies the system-automation catalog overlay. */
function visibleAutomation(
  automation: Doc<"automations"> | null,
): Doc<"automations"> | null {
  const visible = entityVisible(automation);
  return visible ? resolveAutomationDoc(visible) : null;
}

/** Lists all automations for a given repository. */
export const list = authQuery({
  args: { repoId: v.id("githubRepos") },
  returns: v.array(automationDoc),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) {
      return [];
    }
    return await listAutomationsForRepo(ctx.db, args.repoId);
  },
});

/** Returns a single automation by ID. */
export const get = authQuery({
  args: { id: v.id("automations") },
  returns: v.union(automationDoc, v.null()),
  handler: async (ctx, args) => {
    const automation = await ctx.db.get(args.id);
    if (!automation) return null;
    if (!(await hasRepoAccess(ctx.db, automation.repoId, ctx.userId))) {
      return null;
    }
    return visibleAutomation(automation);
  },
});

/** Resolves an automation by per-repo numeric id (URL segment). */
export const getByNumId = authQuery({
  args: {
    repoId: v.id("githubRepos"),
    numId: v.number(),
  },
  returns: v.union(automationDoc, v.null()),
  handler: async (ctx, args) => {
    if (!(await hasRepoAccess(ctx.db, args.repoId, ctx.userId))) {
      return null;
    }
    const automation = await ctx.db
      .query("automations")
      .withIndex("by_repo_and_numId", (q) =>
        q.eq("repoId", args.repoId).eq("numId", args.numId),
      )
      .first();
    if (automation) return visibleAutomation(automation);

    // Shared automations are stored on the canonical (parent) repo, so a
    // child-app lookup misses them; mirror listAutomationsForRepo's fallback.
    const canonicalId = await resolveCanonicalRepoId(ctx.db, args.repoId);
    if (canonicalId === args.repoId) return null;
    const sharedAutomation = await ctx.db
      .query("automations")
      .withIndex("by_repo_and_numId", (q) =>
        q.eq("repoId", canonicalId).eq("numId", args.numId),
      )
      .first();
    if (!sharedAutomation || sharedAutomation.shared !== true) return null;
    return visibleAutomation(sharedAutomation);
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
    const numId = await allocateNumId(ctx.db, args.repoId, "automations");
    return await ctx.db.insert("automations", {
      repoId: args.repoId,
      title: args.title,
      description: "",
      cronSchedule: "",
      enabled: false,
      createdBy: ctx.userId,
      createdAt: now,
      updatedAt: now,
      numId,
    });
  },
});

/** Updates automation fields and syncs the cron schedule (re-registers or deletes as needed). */
export const update = authMutation({
  args: {
    id: v.id("automations"),
    contextRepoId: v.optional(v.id("githubRepos")),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    cronSchedule: v.optional(v.string()),
    model: v.optional(aiModelValidator),
    enabled: v.optional(v.boolean()),
    readOnly: v.optional(v.boolean()),
    actionsEnabled: v.optional(v.boolean()),
    shared: v.optional(v.boolean()),
    sendEmail: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const automation = await ctx.db.get(args.id);
    if (!automation) throw new Error("Automation not found");
    if (!(await hasRepoAccess(ctx.db, automation.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }

    // System automations are code-owned: only the install-level toggles are
    // writable, and they never carry a dynamic cron (crons.ts fans out instead).
    if (automation.systemKey !== undefined) {
      const editsDefinition =
        args.title !== undefined ||
        args.description !== undefined ||
        args.cronSchedule !== undefined ||
        args.model !== undefined ||
        args.readOnly !== undefined ||
        args.actionsEnabled !== undefined ||
        args.shared !== undefined;
      if (editsDefinition) {
        throw new Error(
          "System automations only allow enabled and sendEmail changes",
        );
      }
      const systemPatch: Partial<Doc<"automations">> = { updatedAt: Date.now() };
      if (args.enabled !== undefined) systemPatch.enabled = args.enabled;
      if (args.sendEmail !== undefined) systemPatch.sendEmail = args.sendEmail;
      await ctx.db.patch(args.id, systemPatch);
      return null;
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
    if (args.sendEmail !== undefined) patch.sendEmail = args.sendEmail;

    if (args.shared !== undefined) {
      if (args.contextRepoId === undefined) {
        throw new Error("contextRepoId is required when updating shared");
      }
      if (!(await hasRepoAccess(ctx.db, args.contextRepoId, ctx.userId))) {
        throw new Error("Not authorized");
      }
      patch.shared = args.shared;
      patch.repoId = await resolveAutomationRepoId(
        ctx.db,
        args.contextRepoId,
        args.shared,
      );
    }

    const newSchedule = args.cronSchedule ?? automation.cronSchedule;
    const newEnabled = args.enabled ?? automation.enabled;

    const cronName = `automation-${String(args.id)}`;
    patch.cronJobId = await safeReplaceCron(ctx, {
      name: cronName,
      cronspec: newEnabled && newSchedule ? newSchedule : null,
      handler: internal.automations.triggerAutomation,
      args: { automationId: args.id },
    });

    await ctx.db.patch(args.id, patch);
    return null;
  },
});

/** Soft-deletes an automation: stops cron scheduling but keeps the row and runs. */
export const remove = authMutation({
  args: { id: v.id("automations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const automation = await ctx.db.get(args.id);
    if (!automation) return null;
    if (!(await hasRepoAccess(ctx.db, automation.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    if (automation.systemKey !== undefined) {
      throw new Error("System automations cannot be deleted, only disabled");
    }

    const cronName = `automation-${String(args.id)}`;
    await safeDeleteCron(ctx, cronName);

    await ctx.db.patch(args.id, {
      enabled: false,
      cronJobId: undefined,
      deletedAt: Date.now(),
      updatedAt: Date.now(),
    });
    return null;
  },
});
