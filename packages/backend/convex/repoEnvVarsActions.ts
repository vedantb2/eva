"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { encryptValue, decryptValue } from "./encryption";

/** Decrypts and reveals the plaintext value of a specific repo env var. */
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
      internal.repoEnvVars.getAllInternal,
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

/** Encrypts and upserts a repo env var value. */
export const upsertVar = action({
  args: {
    repoId: v.id("githubRepos"),
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
    await ctx.runMutation(internal.repoEnvVars.upsertVarInternal, {
      repoId: args.repoId,
      key: args.key,
      value: encrypted,
      sandboxExclude: args.sandboxExclude,
    });
    return null;
  },
});
