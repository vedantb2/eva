"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { encryptValue, decryptValue } from "./encryption";

/** Decrypts and reveals the plaintext value of a specific team env var. */
export const revealValue = action({
  args: {
    teamId: v.id("teams"),
    key: v.string(),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const vars: Array<{ key: string; value: string }> = await ctx.runQuery(
      internal.teamEnvVars.getAllInternal,
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

/** Encrypts and upserts a team env var value. */
export const upsertVar = action({
  args: {
    teamId: v.id("teams"),
    key: v.string(),
    value: v.string(),
    sandboxExclude: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const encrypted = encryptValue(args.value);
    await ctx.runMutation(internal.teamEnvVars.upsertVarInternal, {
      teamId: args.teamId,
      key: args.key,
      value: encrypted,
      sandboxExclude: args.sandboxExclude,
    });
    return null;
  },
});
