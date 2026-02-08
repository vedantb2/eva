import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserId } from "./auth";

export const getByUrl = query({
  args: { pageUrl: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) return null;
    const doc = await ctx.db
      .query("annotations")
      .withIndex("by_user_and_url", (q) =>
        q.eq("userId", userId).eq("pageUrl", args.pageUrl),
      )
      .first();
    return doc?.pins ?? null;
  },
});

export const remove = mutation({
  args: { pageUrl: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) return null;
    const existing = await ctx.db
      .query("annotations")
      .withIndex("by_user_and_url", (q) =>
        q.eq("userId", userId).eq("pageUrl", args.pageUrl),
      )
      .first();
    if (existing) await ctx.db.delete(existing._id);
    return null;
  },
});

export const save = mutation({
  args: { pageUrl: v.string(), pins: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) return null;
    const existing = await ctx.db
      .query("annotations")
      .withIndex("by_user_and_url", (q) =>
        q.eq("userId", userId).eq("pageUrl", args.pageUrl),
      )
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        pins: args.pins,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("annotations", {
        userId,
        pageUrl: args.pageUrl,
        pins: args.pins,
        updatedAt: Date.now(),
      });
    }
    return null;
  },
});
