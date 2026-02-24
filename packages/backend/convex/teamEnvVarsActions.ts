"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { encryptValue, decryptValue } from "./encryption";

export const revealValue = action({
  args: {
    teamId: v.id("teams"),
    key: v.string(),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const vars: Array<{ key: string; value: string }> = await ctx.runQuery(
      internal.teamEnvVars.getForSandbox,
      { teamId: args.teamId },
    );
    for (const entry of vars) {
      if (entry.key === args.key) {
        return decryptValue(entry.value);
      }
    }
    return null;
  },
});

export const upsertVar = action({
  args: {
    teamId: v.id("teams"),
    key: v.string(),
    value: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const encrypted = encryptValue(args.value);
    await ctx.runMutation(internal.teamEnvVars.upsertVarInternal, {
      teamId: args.teamId,
      key: args.key,
      value: encrypted,
    });
    return null;
  },
});
