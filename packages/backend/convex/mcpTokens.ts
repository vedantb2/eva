import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

export const store = internalMutation({
  args: {
    tokenId: v.string(),
    convexUrl: v.string(),
    deployKey: v.string(),
    expiresAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("mcpTokens", {
      tokenId: args.tokenId,
      convexUrl: args.convexUrl,
      deployKey: args.deployKey,
      expiresAt: args.expiresAt,
    });
    return null;
  },
});

export const getByTokenId = internalQuery({
  args: { tokenId: v.string() },
  returns: v.union(
    v.object({
      convexUrl: v.string(),
      deployKey: v.string(),
      expiresAt: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("mcpTokens")
      .withIndex("by_token_id", (q) => q.eq("tokenId", args.tokenId))
      .first();
    if (!doc) return null;
    return {
      convexUrl: doc.convexUrl,
      deployKey: doc.deployKey,
      expiresAt: doc.expiresAt,
    };
  },
});

export const remove = internalMutation({
  args: { tokenId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db
      .query("mcpTokens")
      .withIndex("by_token_id", (q) => q.eq("tokenId", args.tokenId))
      .first();
    if (doc) {
      await ctx.db.delete(doc._id);
    }
    return null;
  },
});
