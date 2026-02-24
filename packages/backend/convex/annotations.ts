import { v } from "convex/values";
import { authQuery, authMutation } from "./functions";

export const getByUrl = authQuery({
  args: { pageUrl: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("annotations")
      .withIndex("by_user_and_url", (q) =>
        q.eq("userId", ctx.userId).eq("pageUrl", args.pageUrl),
      )
      .first();
    return doc?.pins ?? null;
  },
});

export const remove = authMutation({
  args: { pageUrl: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("annotations")
      .withIndex("by_user_and_url", (q) =>
        q.eq("userId", ctx.userId).eq("pageUrl", args.pageUrl),
      )
      .first();
    if (existing) await ctx.db.delete(existing._id);
    return null;
  },
});

export const save = authMutation({
  args: { pageUrl: v.string(), pins: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("annotations")
      .withIndex("by_user_and_url", (q) =>
        q.eq("userId", ctx.userId).eq("pageUrl", args.pageUrl),
      )
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        pins: args.pins,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("annotations", {
        userId: ctx.userId,
        pageUrl: args.pageUrl,
        pins: args.pins,
        updatedAt: Date.now(),
      });
    }
    return null;
  },
});
