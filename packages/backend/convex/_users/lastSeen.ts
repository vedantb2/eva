import type {
  GenericDatabaseReader,
  GenericDatabaseWriter,
} from "convex/server";
import type { DataModel, Id } from "../_generated/dataModel";

export const LAST_SEEN_MIN_INTERVAL_MS = 2 * 60 * 1000;

type LastSeenFields = {
  lastSeenAt?: number;
  lastSeenPath?: string;
};

export async function getUserPresenceRow(
  db: GenericDatabaseReader<DataModel>,
  userId: Id<"users">,
) {
  return db
    .query("userPresence")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();
}

export function mergeLastSeen(
  row: LastSeenFields | null,
  user: LastSeenFields | null,
): LastSeenFields {
  return {
    lastSeenAt: row?.lastSeenAt ?? user?.lastSeenAt,
    lastSeenPath: row?.lastSeenPath ?? user?.lastSeenPath,
  };
}

export function shouldWriteLastSeenAt(
  existing: number | undefined,
  now: number,
): boolean {
  return (
    existing === undefined || now - existing > LAST_SEEN_MIN_INTERVAL_MS
  );
}

export async function loadLastSeenAt(
  db: GenericDatabaseReader<DataModel>,
  userId: Id<"users">,
): Promise<number | undefined> {
  const row = await getUserPresenceRow(db, userId);
  if (row?.lastSeenAt !== undefined) return row.lastSeenAt;
  const user = await db.get(userId);
  return user?.lastSeenAt;
}

export async function upsertUserPresence(
  db: GenericDatabaseWriter<DataModel>,
  userId: Id<"users">,
  patch: LastSeenFields,
): Promise<void> {
  const row = await getUserPresenceRow(db, userId);
  if (!row) {
    await db.insert("userPresence", { userId, ...patch });
    return;
  }
  await db.patch(row._id, patch);
}
