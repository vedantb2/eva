import type { GenericDatabaseReader } from "convex/server";
import type { DataModel, Id } from "../_generated/dataModel";
import { resolveUserDisplayFirstName } from "./defaults";
import { isAccountUsableBy } from "./sharing";

/**
 * Snapshot label for which credential powered a run/turn.
 * Returns "Team" when no personal account was selected, the account is missing,
 * or (when ownerUserId is provided) that user cannot run on it. A teammate's
 * shared account labels as its owner's first name — that is who it bills to.
 */
export async function resolveCredentialSourceLabel(
  db: GenericDatabaseReader<DataModel>,
  providerAccountId: Id<"userProviderAccounts"> | undefined,
  ownerUserId?: Id<"users">,
): Promise<string> {
  if (!providerAccountId) return "Team";
  const account = await db.get(providerAccountId);
  if (!account) return "Team";
  if (
    ownerUserId !== undefined &&
    !(await isAccountUsableBy(db, account, ownerUserId))
  )
    return "Team";
  const name = await resolveUserDisplayFirstName(db, account.userId);
  if (name) return name;
  const legacy = account.label.trim();
  return legacy.length > 0 ? legacy : "Team";
}
