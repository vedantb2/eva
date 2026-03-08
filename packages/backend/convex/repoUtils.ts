import type { GenericDatabaseReader } from "convex/server";
import type { DataModel } from "./_generated/dataModel";
import type { Id } from "./_generated/dataModel";

type Ctx = { db: GenericDatabaseReader<DataModel> };

export async function hasRepoReferences(
  ctx: Ctx,
  repoId: Id<"githubRepos">,
): Promise<boolean> {
  const checks = [
    ctx.db
      .query("sessions")
      .withIndex("by_repo", (q) => q.eq("repoId", repoId))
      .first(),
    ctx.db
      .query("projects")
      .withIndex("by_repo", (q) => q.eq("repoId", repoId))
      .first(),
    ctx.db
      .query("docs")
      .withIndex("by_repo", (q) => q.eq("repoId", repoId))
      .first(),
    ctx.db
      .query("researchQueries")
      .withIndex("by_repo", (q) => q.eq("repoId", repoId))
      .first(),
    ctx.db
      .query("savedQueries")
      .withIndex("by_repo", (q) => q.eq("repoId", repoId))
      .first(),
    ctx.db
      .query("routines")
      .withIndex("by_repo", (q) => q.eq("repoId", repoId))
      .first(),
    ctx.db
      .query("evaluationReports")
      .withIndex("by_repo", (q) => q.eq("repoId", repoId))
      .first(),
    ctx.db
      .query("designPersonas")
      .withIndex("by_repo", (q) => q.eq("repoId", repoId))
      .first(),
    ctx.db
      .query("designSessions")
      .withIndex("by_repo", (q) => q.eq("repoId", repoId))
      .first(),
    ctx.db
      .query("repoEnvVars")
      .withIndex("by_repo", (q) => q.eq("repoId", repoId))
      .first(),
    ctx.db
      .query("repoSnapshots")
      .withIndex("by_repo", (q) => q.eq("repoId", repoId))
      .first(),
    ctx.db
      .query("agentTasks")
      .withIndex("by_repo", (q) => q.eq("repoId", repoId))
      .first(),
    ctx.db
      .query("notifications")
      .withIndex("by_repo", (q) => q.eq("repoId", repoId))
      .first(),
  ];

  const results = await Promise.all(checks);
  return results.some((r) => r !== null);
}

export function normalizePath(p: string): string | undefined {
  const trimmed = p.trim().replace(/^\/+|\/+$/g, "");
  return trimmed === "" ? undefined : trimmed;
}
