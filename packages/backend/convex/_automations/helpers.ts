import type { GenericDatabaseReader } from "convex/server";
import type { DataModel, Doc, Id } from "../_generated/dataModel";
import { resolveCanonicalRepoId } from "../_githubRepos/helpers";

export function buildAutomationRunBranchName(
  automationId: Id<"automations">,
  runId: Id<"automationRuns">,
): string {
  return `eva/automation-${String(automationId)}-${String(runId)}`;
}

/** Lists automations visible for a repo: app-specific plus shared monorepo automations. */
export async function listAutomationsForRepo(
  db: GenericDatabaseReader<DataModel>,
  repoId: Id<"githubRepos">,
): Promise<Array<Doc<"automations">>> {
  const canonicalId = await resolveCanonicalRepoId(db, repoId);

  const localAutomations = await db
    .query("automations")
    .withIndex("by_repo", (q) => q.eq("repoId", repoId))
    .collect();

  if (canonicalId === repoId) {
    return localAutomations;
  }

  const appAutomations = localAutomations.filter(
    (automation) => automation.shared !== true,
  );

  const canonicalAutomations = await db
    .query("automations")
    .withIndex("by_repo", (q) => q.eq("repoId", canonicalId))
    .collect();

  const sharedAutomations = canonicalAutomations.filter(
    (automation) => automation.shared === true,
  );

  return [...sharedAutomations, ...appAutomations];
}

/** Resolves repoId storage for an automation when toggling shared scope. */
export async function resolveAutomationRepoId(
  db: GenericDatabaseReader<DataModel>,
  contextRepoId: Id<"githubRepos">,
  shared: boolean,
): Promise<Id<"githubRepos">> {
  if (shared) {
    return resolveCanonicalRepoId(db, contextRepoId);
  }
  return contextRepoId;
}
