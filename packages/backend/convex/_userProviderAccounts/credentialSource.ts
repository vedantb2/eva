import type { GenericDatabaseReader } from "convex/server";
import type { DataModel, Id } from "../_generated/dataModel";

/**
 * Snapshot label for which credential powered a run/turn.
 * Returns "Team" when no personal account was selected, the account is missing,
 * or (when userId is provided) the account is not owned by that user.
 */
export async function resolveCredentialSourceLabel(
  db: GenericDatabaseReader<DataModel>,
  providerAccountId: Id<"userProviderAccounts"> | undefined,
  userId?: Id<"users">,
): Promise<string> {
  if (!providerAccountId) return "Team";
  const account = await db.get(providerAccountId);
  if (!account) return "Team";
  if (userId !== undefined && account.userId !== userId) return "Team";
  const label = account.label.trim();
  return label.length > 0 ? label : "Team";
}
