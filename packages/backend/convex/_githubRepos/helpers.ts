import { v } from "convex/values";
import type { GenericDatabaseReader } from "convex/server";
import type { DataModel, Id } from "../_generated/dataModel";
import { githubRepoFields } from "../validators";

/** Resolves a repo ID to its parent repo ID if it is a sub-app, otherwise returns itself. */
export async function resolveCanonicalRepoId(
  db: GenericDatabaseReader<DataModel>,
  repoId: Id<"githubRepos">,
): Promise<Id<"githubRepos">> {
  const repo = await db.get(repoId);
  if (!repo) return repoId;
  return repo.parentRepoId ?? repoId;
}

/** Finds all repo entries sharing the same owner and name (root + sub-apps). */
export async function findAllSiblingRepoIds(
  db: GenericDatabaseReader<DataModel>,
  repoId: Id<"githubRepos">,
): Promise<Array<Id<"githubRepos">>> {
  const repo = await db.get(repoId);
  if (!repo) return [repoId];

  const siblings = await db
    .query("githubRepos")
    .withIndex("by_owner_and_name", (q) =>
      q.eq("owner", repo.owner).eq("name", repo.name),
    )
    .collect();

  return siblings.map((s) => s._id);
}

/** Validator for the full githubRepos document shape including system fields. */
export const githubRepoValidator = v.object({
  _id: v.id("githubRepos"),
  _creationTime: v.number(),
  ...githubRepoFields,
});
