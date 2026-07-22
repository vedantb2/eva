import {
  getAIModelProvider,
  type AIProvider,
  type Id,
} from "@conductor/backend";
import type { ModelAccount } from "@conductor/ui";

/**
 * Creator default: personal account matching the model's provider (most
 * recently listed wins — caller should sort by updatedAt desc), else null (Team).
 */
export function defaultProviderAccountId(
  accounts: ReadonlyArray<Pick<ModelAccount, "id" | "provider">>,
  model: string | null | undefined,
): string | null {
  const provider: AIProvider = getAIModelProvider(model);
  for (const account of accounts) {
    if (account.provider === provider) return account.id;
  }
  return null;
}

/** Narrow a picker string id to a Convex id when it exists in `accounts`. */
export function resolveProviderAccountId(
  id: string | null,
  accounts: ReadonlyArray<{ _id: Id<"userProviderAccounts"> }>,
): Id<"userProviderAccounts"> | null {
  if (!id) return null;
  const match = accounts.find((account) => account._id === id);
  return match ? match._id : null;
}
