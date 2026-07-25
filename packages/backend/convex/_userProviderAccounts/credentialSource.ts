import type { GenericDatabaseReader } from "convex/server";
import type { DataModel, Id } from "../_generated/dataModel";
import { resolveUserDisplayFirstName } from "./defaults";

/**
 * Snapshot label for which credential powered a run/turn.
 * Returns "Team" when no personal account was selected, the account is missing,
 * or (when ownerUserId is provided) the account is not owned by that user.
 * Personal labels are the account owner's first name (not a free-text label).
 */
export async function resolveCredentialSourceLabel(
  db: GenericDatabaseReader<DataModel>,
  providerAccountId: Id<"userProviderAccounts"> | undefined,
  ownerUserId?: Id<"users">,
): Promise<string> {
  if (!providerAccountId) return "Team";
  const account = await db.get(providerAccountId);
  if (!account) return "Team";
  if (ownerUserId !== undefined && account.userId !== ownerUserId)
    return "Team";
  const name = await resolveUserDisplayFirstName(db, account.userId);
  if (name) return name;
  const legacy = account.label.trim();
  return legacy.length > 0 ? legacy : "Team";
}
