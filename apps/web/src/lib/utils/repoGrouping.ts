import type { FunctionReturnType } from "convex/server";
import type { api } from "@eva/backend";

/** A single repo row from `githubRepos.list` (root repo or a monorepo app). */
export type RepoWithLogo = FunctionReturnType<
  typeof api.githubRepos.list
>[number];

/** The leaf directory name used as a monorepo app's URL/display label. */
export function appLeafName(app: {
  name: string;
  rootDirectory?: string;
}): string {
  return app.rootDirectory?.split("/").pop() ?? app.name;
}

/** Custom `label` when set; otherwise GitHub name / monorepo leaf. */
export function repoDisplayLabel(repo: {
  label?: string;
  name: string;
  rootDirectory?: string;
}): string {
  const custom = repo.label?.trim();
  if (custom) return custom;
  return appLeafName(repo);
}

/** Matches a monorepo app row to the URL `appName` segment. */
export function appMatchesLabel(app: RepoWithLogo, appName: string): boolean {
  const leaf = app.rootDirectory?.split("/").pop();
  return leaf === appName || app.rootDirectory === appName;
}
