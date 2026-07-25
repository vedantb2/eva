import type { GenericDatabaseReader } from "convex/server";
import type { DataModel, Id } from "../_generated/dataModel";
import { getAIModelProvider } from "../validators";

/**
 * Picks the creator's personal account for `model`'s provider (most recently
 * updated wins), or undefined for Team when none match.
 */
export async function resolveDefaultProviderAccountId(
  db: GenericDatabaseReader<DataModel>,
  userId: Id<"users">,
  model: string | undefined,
): Promise<Id<"userProviderAccounts"> | undefined> {
  const provider = getAIModelProvider(model);
  const accounts = await db
    .query("userProviderAccounts")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  let best: (typeof accounts)[number] | undefined;
  for (const account of accounts) {
    if (account.provider !== provider) continue;
    if (!best || account.updatedAt > best.updatedAt) best = account;
  }
  return best?._id;
}

/**
 * Validates that `providerAccountId` is either unset or owned by `ownerUserId`.
 * Returns the id to store, or undefined for Team.
 */
export async function assertProviderAccountOwnedBy(
  db: GenericDatabaseReader<DataModel>,
  providerAccountId: Id<"userProviderAccounts"> | null | undefined,
  ownerUserId: Id<"users">,
): Promise<Id<"userProviderAccounts"> | undefined> {
  if (providerAccountId === null || providerAccountId === undefined) {
    return undefined;
  }
  const account = await db.get(providerAccountId);
  if (!account || account.userId !== ownerUserId) {
    throw new Error("Provider account not found");
  }
  return providerAccountId;
}

/**
 * When the model provider changes, keep the current account only if it still
 * matches; otherwise fall back to the owner's default for the new provider.
 */
export async function reconcileProviderAccountForModel(
  db: GenericDatabaseReader<DataModel>,
  ownerUserId: Id<"users">,
  model: string | undefined,
  currentAccountId: Id<"userProviderAccounts"> | undefined,
): Promise<Id<"userProviderAccounts"> | undefined> {
  if (currentAccountId) {
    const account = await db.get(currentAccountId);
    if (
      account &&
      account.userId === ownerUserId &&
      account.provider === getAIModelProvider(model)
    ) {
      return currentAccountId;
    }
  }
  return await resolveDefaultProviderAccountId(db, ownerUserId, model);
}

/** Display name for credential badges: first name, then full name. */
export async function resolveUserDisplayFirstName(
  db: GenericDatabaseReader<DataModel>,
  userId: Id<"users">,
): Promise<string | undefined> {
  const user = await db.get(userId);
  if (!user) return undefined;
  const first = user.firstName?.trim();
  if (first) return first;
  const full = user.fullName?.trim();
  return full && full.length > 0 ? full : undefined;
}
