import { v } from "convex/values";
import { internalQuery } from "./_generated/server";
import { authMutation, authQuery } from "./functions";
import { syncSettingFields } from "./validators";

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

export const set = authMutation({
  args: {
    owner: v.string(),
    name: v.string(),
    enabled: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("syncSettings")
      .withIndex("by_owner_and_name", (q) =>
        q.eq("owner", args.owner).eq("name", args.name),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { enabled: args.enabled });
    } else {
      await ctx.db.insert("syncSettings", {
        owner: args.owner,
        name: args.name,
        enabled: args.enabled,
      });
    }
    return null;
  },
});

export const bulkSet = authMutation({
  args: {
    owner: v.string(),
    repos: v.array(v.object({ name: v.string(), enabled: v.boolean() })),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (const repo of args.repos) {
      const existing = await ctx.db
        .query("syncSettings")
        .withIndex("by_owner_and_name", (q) =>
          q.eq("owner", args.owner).eq("name", repo.name),
        )
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, { enabled: repo.enabled });
      } else {
        await ctx.db.insert("syncSettings", {
          owner: args.owner,
          name: repo.name,
          enabled: repo.enabled,
        });
      }
    }
    return null;
  },
});
