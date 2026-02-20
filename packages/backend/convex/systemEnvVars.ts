import { v } from "convex/values";
import {
  query,
  internalQuery,
  internalMutation,
  mutation,
} from "./_generated/server";
import { getCurrentUserId } from "./auth";
import { systemEnvVarCategoryValidator } from "./validators";

export const list = query({
  args: {},
  returns: v.array(
    v.object({
      key: v.string(),
      value: v.string(),
      category: systemEnvVarCategoryValidator,
      description: v.optional(v.string()),
    }),
  ),
  handler: async (ctx) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) return [];
    const user = await ctx.db.get(userId);
    if (user?.isAdmin !== true) return [];

    const vars = await ctx.db.query("systemEnvVars").collect();
    return vars.map((entry) => ({
      key: entry.key,
      value: "••••••",
      category: entry.category,
      description: entry.description,
    }));
  },
});

export const getForSandbox = internalQuery({
  args: {},
  returns: v.array(v.object({ key: v.string(), value: v.string() })),
  handler: async (ctx) => {
    const vars = await ctx.db
      .query("systemEnvVars")
      .withIndex("by_category", (q) => q.eq("category", "infrastructure"))
      .collect();
    return vars.map((entry) => ({ key: entry.key, value: entry.value }));
  },
});

export const getOAuthAccounts = internalQuery({
  args: {},
  returns: v.array(v.object({ id: v.id("systemEnvVars"), value: v.string() })),
  handler: async (ctx) => {
    const vars = await ctx.db
      .query("systemEnvVars")
      .withIndex("by_category", (q) => q.eq("category", "claude_oauth"))
      .collect();
    return vars.map((entry) => ({ id: entry._id, value: entry.value }));
  },
});

export const getAll = internalQuery({
  args: {},
  returns: v.array(v.object({ key: v.string(), value: v.string() })),
  handler: async (ctx) => {
    const vars = await ctx.db.query("systemEnvVars").collect();
    return vars.map((entry) => ({ key: entry.key, value: entry.value }));
  },
});

export const getEncryptedValue = internalQuery({
  args: { accountId: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const normalizedId = ctx.db.normalizeId("systemEnvVars", args.accountId);
    if (!normalizedId) return null;
    const doc = await ctx.db.get(normalizedId);
    if (!doc) return null;
    return doc.value;
  },
});

export const upsertVarInternal = internalMutation({
  args: {
    key: v.string(),
    value: v.string(),
    category: systemEnvVarCategoryValidator,
    description: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("systemEnvVars")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        category: args.category,
        description: args.description,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("systemEnvVars", {
        key: args.key,
        value: args.value,
        category: args.category,
        description: args.description,
        updatedAt: Date.now(),
      });
    }
    return null;
  },
});

export const removeVar = mutation({
  args: { key: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const user = await ctx.db.get(userId);
    if (user?.isAdmin !== true) throw new Error("Not authorized");

    const doc = await ctx.db
      .query("systemEnvVars")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    if (!doc) return null;

    const linkedStatus = await ctx.db
      .query("aiAccountStatus")
      .withIndex("by_account", (q) => q.eq("accountId", doc._id))
      .first();
    if (linkedStatus) {
      await ctx.db.delete(linkedStatus._id);
    }

    await ctx.db.delete(doc._id);
    return null;
  },
});

export const getSetupStatus = query({
  args: {},
  returns: v.object({
    oauthAccountCount: v.number(),
    isReady: v.boolean(),
  }),
  handler: async (ctx) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) return { oauthAccountCount: 0, isReady: false };

    const oauthAccounts = await ctx.db
      .query("systemEnvVars")
      .withIndex("by_category", (q) => q.eq("category", "claude_oauth"))
      .collect();

    return {
      oauthAccountCount: oauthAccounts.length,
      isReady: oauthAccounts.length >= 1,
    };
  },
});

export const isAdmin = internalQuery({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const userId = await getCurrentUserId(ctx);
    if (!userId) return false;
    const user = await ctx.db.get(userId);
    return user?.isAdmin === true;
  },
});
