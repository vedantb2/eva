import type { FunctionReturnType } from "convex/server";
import type { api } from "@conductor/backend";

/** A single repo row from `githubRepos.list` (root repo or a monorepo app). */
export type RepoWithLogo = FunctionReturnType<
  typeof api.githubRepos.list
>[number];

/** The leaf directory name used as a monorepo app's URL/display label. */
export function appLeafName(app: RepoWithLogo): string {
  return app.rootDirectory?.split("/").pop() ?? app.name;
}

/** Matches a monorepo app row to the URL `appName` segment. */
export function appMatchesLabel(app: RepoWithLogo, appName: string): boolean {
  const leaf = app.rootDirectory?.split("/").pop();
  return leaf === appName || app.rootDirectory === appName;
}
