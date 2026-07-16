import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import { internalQuery } from "./_generated/server";
import { authMutation, authQuery } from "./functions";
import { syncSettingFields } from "./validators";

/** Creates the sync setting for an owner/name pair, or patches its enabled flag if it already exists. */
async function upsertSyncSetting(
  ctx: MutationCtx,
  owner: string,
  name: string,
  enabled: boolean,
): Promise<void> {
  const existing = await ctx.db
    .query("syncSettings")
    .withIndex("by_owner_and_name", (q) =>
      q.eq("owner", owner).eq("name", name),
    )
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, { enabled });
  } else {
    await ctx.db.insert("syncSettings", { owner, name, enabled });
  }
}

/** Lists all sync settings as owner/name/enabled triples (internal use only). */
export const listAll = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      owner: v.string(),
      name: v.string(),
      enabled: v.boolean(),
    }),
  ),
  handler: async (ctx) => {
    const settings = await ctx.db.query("syncSettings").collect();
    return settings.map((s) => ({
      owner: s.owner,
      name: s.name,
      enabled: s.enabled,
    }));
  },
});

/** Lists all sync settings with full document fields for the authenticated user. */
export const list = authQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("syncSettings"),
      _creationTime: v.number(),
      ...syncSettingFields,
    }),
  ),
  handler: async (ctx) => {
    return await ctx.db.query("syncSettings").collect();
  },
});

/** Creates or updates the enabled flag for a single repo's sync setting. */
export const set = authMutation({
  args: {
    owner: v.string(),
    name: v.string(),
    enabled: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await upsertSyncSetting(ctx, args.owner, args.name, args.enabled);
    return null;
  },
});

/** Creates or updates sync settings for multiple repos under the same owner in one call. */
export const bulkSet = authMutation({
  args: {
    owner: v.string(),
    repos: v.array(v.object({ name: v.string(), enabled: v.boolean() })),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (const repo of args.repos) {
      await upsertSyncSetting(ctx, args.owner, repo.name, repo.enabled);
    }
    return null;
  },
});
