"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { encryptValue, decryptValue } from "./encryption";
import { aiProviderValidator } from "./validators";
import type { Id } from "./_generated/dataModel";

const credentialInputValidator = v.object({
  key: v.string(),
  value: v.string(),
});

/** Resolves the authenticated user's id inside a node action, or throws. */
async function requireUserId(ctx: ActionCtx): Promise<Id<"users">> {
  const userId = await ctx.runQuery(internal.auth.getUserIdFromIdentity, {});
  if (!userId) {
    throw new Error("Not authenticated");
  }
  return userId;
}

/**
 * Creates or updates a provider account, encrypting each credential value at
 * rest. On create, `accountId` is absent and `provider` fixes the account's
 * agent; on edit, `accountId` is supplied and `provider` is ignored (immutable).
 */
export const upsert = action({
  args: {
    accountId: v.optional(v.id("userProviderAccounts")),
    provider: aiProviderValidator,
    label: v.string(),
    accentColor: v.optional(v.string()),
    credentials: v.array(credentialInputValidator),
  },
  returns: v.id("userProviderAccounts"),
  handler: async (ctx, args): Promise<Id<"userProviderAccounts">> => {
    const userId = await requireUserId(ctx);
    const encrypted = args.credentials.map((entry) => ({
      key: entry.key,
      value: encryptValue(entry.value),
    }));
    if (args.accountId) {
      await ctx.runMutation(internal.userProviderAccounts.updateInternal, {
        accountId: args.accountId,
        userId,
        label: args.label,
        accentColor: args.accentColor,
        credentials: encrypted,
      });
      return args.accountId;
    }
    return await ctx.runMutation(internal.userProviderAccounts.createInternal, {
      userId,
      provider: args.provider,
      label: args.label,
      accentColor: args.accentColor,
      credentials: encrypted,
    });
  },
});

/** Decrypts and returns one credential value for an account the user owns. */
export const revealValue = action({
  args: {
    accountId: v.id("userProviderAccounts"),
    key: v.string(),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args): Promise<string | null> => {
    const userId = await requireUserId(ctx);
    const account = await ctx.runQuery(
      internal.userProviderAccounts.getByIdInternal,
      { accountId: args.accountId },
    );
    if (!account || account.userId !== userId) {
      throw new Error("Account not found");
    }
    const entry = account.credentials.find((c) => c.key === args.key);
    return entry ? decryptValue(entry.value) : null;
  },
});
