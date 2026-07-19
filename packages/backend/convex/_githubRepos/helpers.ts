import { v } from "convex/values";
import type { GenericDatabaseReader } from "convex/server";
import type { DataModel, Doc, Id } from "../_generated/dataModel";
import { githubRepoFields } from "../validators";
import { hasRepoAccess } from "../functions";
import { pickSandboxRepoId } from "./sandboxRepoPick";

export {
  pickDefaultVisibleAppRepo,
  pickSandboxRepoId,
  type AppRepoPickFields,
} from "./sandboxRepoPick";

/** Resolves a repo ID to its parent repo ID if it is a sub-app, otherwise returns itself. */
export async function resolveCanonicalRepoId(
  db: GenericDatabaseReader<DataModel>,
  repoId: Id<"githubRepos">,
): Promise<Id<"githubRepos">> {
  const repo = await db.get(repoId);
  if (!repo) return repoId;
  if (repo.parentRepoId) {
    const parent = await db.get(repo.parentRepoId);
    if (parent) return parent._id;
  }
  return repoId;
}

/** Stable repo id for codebase-wide docs (PR recaps). Prefers root row, else first connected sibling. */
export async function resolveCodebaseDocsRepoId(
  db: GenericDatabaseReader<DataModel>,
  repoId: Id<"githubRepos">,
): Promise<Id<"githubRepos">> {
  const siblings = await findSiblingRepos(db, repoId);
  if (siblings.length === 0) return repoId;

  const root = siblings.find((repo) => repo.rootDirectory === undefined);
  if (root) return root._id;

  const connected = siblings.find((repo) => repo.connectedBy !== undefined);
  if (connected) return connected._id;

  return repoId;
}

/** True when the user can access any repo row for the same GitHub owner/name codebase. */
export async function hasCodebaseRepoAccess(
  db: GenericDatabaseReader<DataModel>,
  repoId: Id<"githubRepos">,
  userId: Id<"users">,
): Promise<boolean> {
  const siblingIds = await findAllSiblingRepoIds(db, repoId);
  for (const siblingId of siblingIds) {
    if (await hasRepoAccess(db, siblingId, userId)) return true;
  }
  return false;
}

/** Finds all repo rows sharing the same GitHub owner and name (root + sub-apps). */
export async function findSiblingRepos(
  db: GenericDatabaseReader<DataModel>,
  repoId: Id<"githubRepos">,
): Promise<Array<Doc<"githubRepos">>> {
  const repo = await db.get(repoId);
  if (!repo) return [];

  return await db
    .query("githubRepos")
    .withIndex("by_owner_and_name", (q) =>
      q.eq("owner", repo.owner).eq("name", repo.name),
    )
    .collect();
}

/** Finds all repo entry ids sharing the same owner and name (root + sub-apps). */
export async function findAllSiblingRepoIds(
  db: GenericDatabaseReader<DataModel>,
  repoId: Id<"githubRepos">,
): Promise<Array<Id<"githubRepos">>> {
  const siblings = await findSiblingRepos(db, repoId);
  if (siblings.length === 0) return [repoId];
  return siblings.map((s) => s._id);
}

/**
 * Picks which githubRepos row to use for sandbox credentials.
 * Shared automations and PR recaps often run against the monorepo root, which
 * has no VERCEL_PROJECT_ID — credentials live on app rows.
 */
export async function resolveSandboxRepoId(
  db: GenericDatabaseReader<DataModel>,
  workflowRepoId: Id<"githubRepos">,
  siblings?: Array<Doc<"githubRepos">>,
): Promise<Id<"githubRepos">> {
  const siblingRepos = siblings ?? (await findSiblingRepos(db, workflowRepoId));
  return pickSandboxRepoId(workflowRepoId, siblingRepos, async (repoId) => {
    const envDoc = await db
      .query("repoEnvVars")
      .withIndex("by_repo", (q) => q.eq("repoId", repoId))
      .first();
    return (
      envDoc?.vars.some((entry) => entry.key === "VERCEL_PROJECT_ID") === true
    );
  });
}

/** Validator for the full githubRepos document shape including system fields. */
export const githubRepoValidator = v.object({
  _id: v.id("githubRepos"),
  _creationTime: v.number(),
  ...githubRepoFields,
});

/**
 * Repo document plus a resolved `logoUrl` (from `logoStorageId`) for the list
 * views that render the logo. Only `list`/`listByTeam` pay the storage lookup;
 * the plain `githubRepoValidator` stays cheap for every other query.
 */
export const githubRepoWithLogoValidator = v.object({
  _id: v.id("githubRepos"),
  _creationTime: v.number(),
  ...githubRepoFields,
  logoUrl: v.optional(v.union(v.string(), v.null())),
});
