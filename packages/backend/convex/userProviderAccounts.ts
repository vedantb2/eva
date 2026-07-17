import { v } from "convex/values";
import { internalQuery, internalMutation } from "./_generated/server";
import { authQuery, authMutation } from "./functions";
import { aiProviderValidator } from "./validators";

const credentialValidator = v.object({ key: v.string(), value: v.string() });

/**
 * Lists the authenticated user's provider accounts, masking credential values.
 * Powers both the Accounts settings page and the model picker's account groups.
 */
export const list = authQuery({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("userProviderAccounts"),
      _creationTime: v.number(),
      provider: aiProviderValidator,
      label: v.string(),
      accentColor: v.optional(v.string()),
      credentials: v.array(credentialValidator),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("userProviderAccounts")
      .withIndex("by_user", (q) => q.eq("userId", ctx.userId))
      .collect();
    return rows.map((row) => ({
      _id: row._id,
      _creationTime: row._creationTime,
      provider: row.provider,
      label: row.label,
      accentColor: row.accentColor,
      credentials: row.credentials.map((entry) => ({
        key: entry.key,
        value: "••••••",
      })),
      updatedAt: row.updatedAt,
    }));
  },
});

/**
 * Returns a single account with raw (encrypted) credentials for launch-time
 * injection. Includes `userId` so the caller can assert ownership before
 * decrypting. Internal only.
 */
export const getByIdInternal = internalQuery({
  args: { accountId: v.id("userProviderAccounts") },
  returns: v.union(
    v.null(),
    v.object({
      userId: v.id("users"),
      provider: aiProviderValidator,
      credentials: v.array(credentialValidator),
    }),
  ),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.accountId);
    if (!doc) return null;
    return {
      userId: doc.userId,
      provider: doc.provider,
      credentials: doc.credentials,
    };
  },
});

/** Inserts a new account with pre-encrypted credentials. Internal only. */
export const createInternal = internalMutation({
  args: {
    userId: v.id("users"),
    provider: aiProviderValidator,
    label: v.string(),
    accentColor: v.optional(v.string()),
    credentials: v.array(credentialValidator),
  },
  returns: v.id("userProviderAccounts"),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("userProviderAccounts", {
      userId: args.userId,
      provider: args.provider,
      label: args.label,
      accentColor: args.accentColor,
      credentials: args.credentials,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Updates an existing account's label, accent, and pre-encrypted credentials.
 * Asserts ownership. Provider is immutable (it determines which credential keys
 * apply). Internal only.
 */
export const updateInternal = internalMutation({
  args: {
    accountId: v.id("userProviderAccounts"),
    userId: v.id("users"),
    label: v.string(),
    accentColor: v.optional(v.string()),
    credentials: v.array(credentialValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.accountId);
    if (!doc || doc.userId !== args.userId) {
      throw new Error("Account not found");
    }
    await ctx.db.patch(args.accountId, {
      label: args.label,
      accentColor: args.accentColor,
      credentials: args.credentials,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/** Deletes one of the authenticated user's own accounts. */
export const remove = authMutation({
  args: { accountId: v.id("userProviderAccounts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.accountId);
    if (!doc || doc.userId !== ctx.userId) {
      throw new Error("Account not found");
    }
    await ctx.db.delete(args.accountId);
    return null;
  },
});
