"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { encryptValue, decryptValue } from "./encryption";

export const store = action({
  args: {
    tokenId: v.string(),
    convexUrl: v.string(),
    deployKey: v.string(),
    expiresAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const encryptedDeployKey = encryptValue(args.deployKey);
    await ctx.runMutation(internal.mcpTokens.store, {
      tokenId: args.tokenId,
      convexUrl: args.convexUrl,
      deployKey: encryptedDeployKey,
      expiresAt: args.expiresAt,
    });
    return null;
  },
});

const tokenDataValidator = v.object({
  convexUrl: v.string(),
  deployKey: v.string(),
  expiresAt: v.number(),
});

export const retrieve = action({
  args: { tokenId: v.string() },
  returns: v.union(tokenDataValidator, v.null()),
  handler: async (
    ctx,
    args,
  ): Promise<{
    convexUrl: string;
    deployKey: string;
    expiresAt: number;
  } | null> => {
    const result = await ctx.runQuery(internal.mcpTokens.getByTokenId, {
      tokenId: args.tokenId,
    });
    if (!result) return null;
    return {
      convexUrl: result.convexUrl,
      deployKey: decryptValue(result.deployKey),
      expiresAt: result.expiresAt,
    };
  },
});
