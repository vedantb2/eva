import type { FunctionReturnType } from "convex/server";
import type { api } from "@conductor/backend";

/** A single repo row from `githubRepos.list` (root repo or a monorepo app). */
export type RepoWithLogo = FunctionReturnType<
  typeof api.githubRepos.list
>[number];

/**
 * One GitHub codebase (owner/name), with its optional root repo doc and any
 * monorepo app rows that share the same owner/name. Monorepo apps are separate
 * `githubRepos` rows carrying a `rootDirectory`.
 */
export interface CodebaseGroup {
  owner: string;
  name: string;
  /** Root (non-app) doc when the codebase itself is directly selectable. */
  root: RepoWithLogo | null;
  apps: RepoWithLogo[];
}

/** The leaf directory name used as a monorepo app's URL/display label. */
export function appLeafName(app: RepoWithLogo): string {
  return app.rootDirectory?.split("/").pop() ?? app.name;
}

/** Matches a monorepo app row to the URL `appName` segment. */
export function appMatchesLabel(app: RepoWithLogo, appName: string): boolean {
  const leaf = app.rootDirectory?.split("/").pop();
  return leaf === appName || app.rootDirectory === appName;
}

/**
 * Groups repo rows into a flat, sorted list of codebases (owner→name), folding
 * monorepo app rows under their shared codebase. Sorted by owner then name;
 * apps sorted by leaf name.
 */
export function groupReposByCodebase(repos: RepoWithLogo[]): CodebaseGroup[] {
  const map = new Map<string, CodebaseGroup>();

  for (const repo of repos) {
    const key = `${repo.owner}/${repo.name}`;
    const existing = map.get(key);
    if (existing) {
      if (repo.rootDirectory) {
        existing.apps.push(repo);
      } else {
        existing.root = repo;
      }
    } else {
      map.set(key, {
        owner: repo.owner,
        name: repo.name,
        root: repo.rootDirectory ? null : repo,
        apps: repo.rootDirectory ? [repo] : [],
      });
    }
  }

  const groups = [...map.values()];
  for (const group of groups) {
    group.apps.sort((a, b) => appLeafName(a).localeCompare(appLeafName(b)));
  }
  groups.sort(
    (a, b) => a.owner.localeCompare(b.owner) || a.name.localeCompare(b.name),
  );
  return groups;
}
