import { getAIModelProvider, type AIProvider } from "@eva/backend";
import type { ModelAccount } from "@eva/ui";

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
