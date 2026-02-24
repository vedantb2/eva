"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { encryptValue, decryptValue } from "./encryption";

export const revealValue = action({
  args: {
    repoId: v.id("githubRepos"),
    key: v.string(),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const vars: Array<{ key: string; value: string }> = await ctx.runQuery(
      internal.repoEnvVars.getForSandbox,
      { repoId: args.repoId },
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
    repoId: v.id("githubRepos"),
    key: v.string(),
    value: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }
    const encrypted = encryptValue(args.value);
    await ctx.runMutation(internal.repoEnvVars.upsertVarInternal, {
      repoId: args.repoId,
      key: args.key,
      value: encrypted,
    });
    return null;
  },
});
