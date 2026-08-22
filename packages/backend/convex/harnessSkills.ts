import { v } from "convex/values";
import { authMutation, authQuery } from "./functions";
import { aiProviderValidator } from "./_validators/aiModels";
import { harnessSkillValidator } from "./_validators/tableFields";
import {
  filterHarnessCommands,
  isHarnessCatalogUnchanged,
} from "./_harnessSkills/filter";

/**
 * The built-in slash commands a harness CLI ships with, reported live from the
 * sandboxes that run it. One global row per provider — every sandbox boots from
 * the same image, so the CLI build is fleet-wide, not per repo.
 */

const catalogValidator = v.object({
  cliVersion: v.string(),
  skills: v.array(harnessSkillValidator),
});

/** The catalog for a provider, or null before any sandbox has reported one. */
export const getForProvider = authQuery({
  args: { provider: aiProviderValidator },
  returns: v.union(v.null(), catalogValidator),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("harnessSkillCatalogs")
      .withIndex("by_provider", (q) => q.eq("provider", args.provider))
      .unique();
    return row ? { cliVersion: row.cliVersion, skills: row.skills } : null;
  },
});

/**
 * Records what a sandbox's harness CLI reported at session start. Public
 * (not internal) because the caller is the sandbox callback, which reaches
 * Convex over `/api/mutation` with its own identity token — the same transport
 * and auth `streaming:touch` uses.
 *
 * A no-op when nothing changed: every daemon boot reports, and this row is
 * global, so writing unconditionally would serialize fleet-wide.
 */
export const upsertForProvider = authMutation({
  args: {
    provider: aiProviderValidator,
    cliVersion: v.string(),
    commands: v.array(harnessSkillValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const skills = filterHarnessCommands(args.commands);
    if (skills.length === 0) return null;

    const existing = await ctx.db
      .query("harnessSkillCatalogs")
      .withIndex("by_provider", (q) => q.eq("provider", args.provider))
      .unique();
    const next = { cliVersion: args.cliVersion, skills };
    if (existing && isHarnessCatalogUnchanged(existing, next)) return null;

    if (existing) {
      await ctx.db.patch(existing._id, { ...next, updatedAt: Date.now() });
      return null;
    }
    await ctx.db.insert("harnessSkillCatalogs", {
      provider: args.provider,
      ...next,
      updatedAt: Date.now(),
    });
    return null;
  },
});
