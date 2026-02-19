"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { encryptValue, decryptValue } from "./encryption";
import { systemEnvVarCategoryValidator } from "./validators";

export const upsertVar = action({
  args: {
    key: v.string(),
    value: v.string(),
    category: systemEnvVarCategoryValidator,
    description: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const isAdminUser = await ctx.runQuery(internal.systemEnvVars.isAdmin, {});
    if (!isAdminUser) throw new Error("Not authorized - admin access required");

    const encrypted = encryptValue(args.value);
    await ctx.runMutation(internal.systemEnvVars.upsertVarInternal, {
      key: args.key,
      value: encrypted,
      category: args.category,
      description: args.description,
    });
    return null;
  },
});

export const revealValue = action({
  args: { key: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const isAdminUser = await ctx.runQuery(internal.systemEnvVars.isAdmin, {});
    if (!isAdminUser) throw new Error("Not authorized - admin access required");

    const vars: Array<{ key: string; value: string }> = await ctx.runQuery(
      internal.systemEnvVars.getAll,
      {},
    );
    for (const entry of vars) {
      if (entry.key === args.key) {
        return decryptValue(entry.value);
      }
    }
    return null;
  },
});
