import { v } from "convex/values";
import type { QueryCtx } from "./_generated/server";
import { internalQuery, internalMutation } from "./_generated/server";
import {
  authQuery,
  authMutation,
  hasRepoAccess,
  hasTaskAccess,
} from "./functions";
import type { Id } from "./_generated/dataModel";
import { aiProviderValidator } from "./validators";
import { resolveUserDisplayFirstName } from "./_userProviderAccounts/defaults";

const credentialValidator = v.object({ key: v.string(), value: v.string() });

const accountListItemValidator = v.object({
  _id: v.id("userProviderAccounts"),
  _creationTime: v.number(),
  provider: aiProviderValidator,
  label: v.string(),
  credentials: v.array(credentialValidator),
  updatedAt: v.number(),
});

/**
 * One user's accounts with credential values masked, labelled with that user's
 * first name. Shared by every picker query so owner-scoped lists and the
 * viewer's own list cannot drift apart.
 */
async function listAccountsFor(ctx: QueryCtx, userId: Id<"users">) {
  const displayName =
    (await resolveUserDisplayFirstName(ctx.db, userId)) ?? "Personal";
  const rows = await ctx.db
    .query("userProviderAccounts")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  return rows.map((row) => ({
    _id: row._id,
    _creationTime: row._creationTime,
    provider: row.provider,
    label: displayName,
    credentials: row.credentials.map((entry) => ({
      key: entry.key,
      value: "••••••",
    })),
    updatedAt: row.updatedAt,
  }));
}

/**
 * Lists the authenticated user's provider accounts, masking credential values.
 * Powers both the Accounts settings page and the model picker's account groups.
 * `label` is always the user's first name (derived), not a free-text field.
 */
export const list = authQuery({
  args: {},
  returns: v.array(accountListItemValidator),
  handler: async (ctx) => await listAccountsFor(ctx, ctx.userId),
});

/**
 * Lists the task owner's personal provider accounts (masked) for the model
 * picker. Teammates with task access can see which accounts power the sticky
 * credential; only the owner can change the selection.
 */
export const listForTaskOwner = authQuery({
  args: { taskId: v.id("agentTasks") },
  returns: v.array(accountListItemValidator),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || !(await hasTaskAccess(ctx.db, task, ctx.userId))) {
      return [];
    }
    return await listAccountsFor(ctx, task.createdBy);
  },
});

/**
 * Lists the session owner's personal provider accounts (masked) for the model
 * picker. A session runs on its owner's credentials whoever sends the turn, so
 * collaborators see — and pick from — the owner's accounts, never their own.
 */
export const listForSessionOwner = authQuery({
  args: { sessionId: v.id("sessions") },
  returns: v.array(accountListItemValidator),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (
      !session ||
      !(await hasRepoAccess(ctx.db, session.repoId, ctx.userId))
    ) {
      return [];
    }
    return await listAccountsFor(ctx, session.createdBy ?? session.userId);
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
    credentials: v.array(credentialValidator),
  },
  returns: v.id("userProviderAccounts"),
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("userProviderAccounts", {
      userId: args.userId,
      provider: args.provider,
      label: args.label,
      credentials: args.credentials,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Updates an existing account's pre-encrypted credentials. Asserts ownership.
 * Provider is immutable. Label is always overwritten from the owner's first
 * name. Internal only.
 */
export const updateInternal = internalMutation({
  args: {
    accountId: v.id("userProviderAccounts"),
    userId: v.id("users"),
    label: v.string(),
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
