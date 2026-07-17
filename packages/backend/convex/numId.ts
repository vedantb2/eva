import type { GenericDatabaseWriter } from "convex/server";
import type { DataModel, Id } from "./_generated/dataModel";

export type RepoEntityType =
  | "sessions"
  | "docs"
  | "projects"
  | "agentTasks"
  | "designSessions"
  | "automations";

/** True when an entity was soft-deleted and should be hidden / 404 in the UI. */
export function isEntityDeleted(doc: { deletedAt?: number }): boolean {
  return doc.deletedAt !== undefined;
}

/**
 * Atomically allocates the next per-repo numId for an entity type.
 * Must run in the same mutation as the entity insert.
 */
export async function allocateNumId(
  db: GenericDatabaseWriter<DataModel>,
  repoId: Id<"githubRepos">,
  entityType: RepoEntityType,
): Promise<number> {
  const counter = await db
    .query("repoEntityCounters")
    .withIndex("by_repo_and_type", (q) =>
      q.eq("repoId", repoId).eq("entityType", entityType),
    )
    .first();

  if (counter) {
    const numId = counter.nextNumId;
    await db.patch(counter._id, { nextNumId: numId + 1 });
    return numId;
  }

  await db.insert("repoEntityCounters", {
    repoId,
    entityType,
    nextNumId: 2,
  });
  return 1;
}

/** Shared lookup for getByNumId queries — returns null when deleted or missing. */
export function entityVisible<T extends { deletedAt?: number }>(
  doc: T | null,
): T | null {
  if (!doc || isEntityDeleted(doc)) return null;
  return doc;
}

/** Omits soft-deleted rows from list results. */
export function filterActiveEntities<T extends { deletedAt?: number }>(
  items: readonly T[],
): T[] {
  return items.filter((item) => !isEntityDeleted(item));
}
