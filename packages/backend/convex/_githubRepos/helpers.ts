import { v } from "convex/values";
import type { GenericDatabaseReader } from "convex/server";
import type { DataModel, Id } from "../_generated/dataModel";
import { claudeModelValidator } from "../validators";

export async function resolveCanonicalRepoId(
  db: GenericDatabaseReader<DataModel>,
  repoId: Id<"githubRepos">,
): Promise<Id<"githubRepos">> {
  const repo = await db.get(repoId);
  if (!repo) return repoId;
  return repo.parentRepoId ?? repoId;
}

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

export const githubRepoValidator = v.object({
  _id: v.id("githubRepos"),
  _creationTime: v.number(),
  owner: v.string(),
  name: v.string(),
  installationId: v.number(),
  githubId: v.optional(v.number()),
  connected: v.optional(v.boolean()),
  connectedBy: v.optional(v.id("users")),
  teamId: v.optional(v.id("teams")),
  rootDirectory: v.optional(v.string()),
  parentRepoId: v.optional(v.id("githubRepos")),
  defaultBaseBranch: v.optional(v.string()),
  defaultModel: v.optional(claudeModelValidator),
  sessionsVncEnabled: v.optional(v.boolean()),
  sessionsVscodeEnabled: v.optional(v.boolean()),
  hidden: v.optional(v.boolean()),
});
