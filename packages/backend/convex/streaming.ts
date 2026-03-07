import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { authQuery, authMutation } from "./functions";

export const get = authQuery({
  args: { entityId: v.string() },
  returns: v.union(v.object({ currentActivity: v.string() }), v.null()),
  handler: async (ctx, args) => {
    const streaming = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", args.entityId))
      .first();
    if (!streaming) return null;
    return { currentActivity: streaming.currentActivity };
  },
});

export const set = authMutation({
  args: { entityId: v.string(), currentActivity: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", args.entityId))
      .first();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        currentActivity: args.currentActivity,
        lastUpdatedAt: now,
      });
    } else {
      await ctx.db.insert("streamingActivity", {
        entityId: args.entityId,
        currentActivity: args.currentActivity,
        lastUpdatedAt: now,
      });
    }
    return null;
  },
});

export const internalGet = internalQuery({
  args: { entityId: v.string() },
  returns: v.union(v.object({ currentActivity: v.string() }), v.null()),
  handler: async (ctx, args) => {
    const streaming = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", args.entityId))
      .first();
    if (!streaming) return null;
    return { currentActivity: streaming.currentActivity };
  },
});

export const internalSet = internalMutation({
  args: { entityId: v.string(), currentActivity: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", args.entityId))
      .first();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        currentActivity: args.currentActivity,
        lastUpdatedAt: now,
      });
    } else {
      await ctx.db.insert("streamingActivity", {
        entityId: args.entityId,
        currentActivity: args.currentActivity,
        lastUpdatedAt: now,
      });
    }
    return null;
  },
});

export const clear = authMutation({
  args: { entityId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", args.entityId))
      .first();
    if (existing) await ctx.db.delete(existing._id);
    return null;
  },
});
