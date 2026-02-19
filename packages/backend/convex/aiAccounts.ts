import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

export const markAccountLimited = internalMutation({
  args: {
    accountKey: v.string(),
    limitResetAt: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const accountId = ctx.db.normalizeId("systemEnvVars", args.accountKey);
    if (!accountId) {
      console.error(`Invalid systemEnvVar ID: ${args.accountKey}`);
      return null;
    }

    const existing = await ctx.db
      .query("aiAccountStatus")
      .withIndex("by_account", (q) => q.eq("accountId", accountId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        isLimited: true,
        limitResetAt: args.limitResetAt,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("aiAccountStatus", {
        accountId,
        isLimited: true,
        limitResetAt: args.limitResetAt,
        updatedAt: Date.now(),
      });
    }
    return null;
  },
});

export const clearExpiredLimits = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const now = Date.now();
    const allStatuses = await ctx.db.query("aiAccountStatus").collect();
    for (const status of allStatuses) {
      if (
        status.isLimited &&
        status.limitResetAt !== undefined &&
        status.limitResetAt < now
      ) {
        await ctx.db.patch(status._id, {
          isLimited: false,
          updatedAt: now,
        });
      }
    }
    return null;
  },
});

export const getAvailableAccountKey = internalQuery({
  args: {},
  returns: v.union(v.string(), v.null()),
  handler: async (ctx) => {
    const oauthAccounts = await ctx.db
      .query("systemEnvVars")
      .withIndex("by_category", (q) => q.eq("category", "claude_oauth"))
      .collect();

    if (oauthAccounts.length === 0) return null;

    const allStatuses = await ctx.db.query("aiAccountStatus").collect();
    const limitedIds = new Set(
      allStatuses.filter((s) => s.isLimited).map((s) => String(s.accountId)),
    );

    for (const account of oauthAccounts) {
      if (!limitedIds.has(String(account._id))) {
        return String(account._id);
      }
    }

    return null;
  },
});

export const getEarliestResetTime = internalQuery({
  args: {},
  returns: v.union(v.number(), v.null()),
  handler: async (ctx) => {
    const allStatuses = await ctx.db.query("aiAccountStatus").collect();
    const limitedWithReset = allStatuses.filter(
      (s) => s.isLimited && s.limitResetAt !== undefined,
    );
    if (limitedWithReset.length === 0) return null;

    let earliest = Infinity;
    for (const s of limitedWithReset) {
      if (s.limitResetAt !== undefined && s.limitResetAt < earliest) {
        earliest = s.limitResetAt;
      }
    }
    return earliest === Infinity ? null : earliest;
  },
});
