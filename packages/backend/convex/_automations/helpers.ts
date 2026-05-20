import type { GenericDatabaseReader } from "convex/server";
import type { DataModel, Id } from "../_generated/dataModel";
import { resolveCanonicalRepoId } from "../_githubRepos/helpers";

/** Resolves which repo owns automations for the given repo context. */
export async function resolveAutomationsRepoId(
  db: GenericDatabaseReader<DataModel>,
  repoId: Id<"githubRepos">,
): Promise<Id<"githubRepos">> {
  const repo = await db.get(repoId);
  if (!repo) return repoId;
  if (repo.sharedAutomationsEnabled === true) {
    return resolveCanonicalRepoId(db, repoId);
  }
  return repoId;
}
