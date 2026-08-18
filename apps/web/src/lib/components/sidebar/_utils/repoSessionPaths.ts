import { repoHref } from "@/lib/utils/repoUrl";
import type { RepoWithLogo } from "@/lib/utils/repoGrouping";

/**
 * Base path(s) for a repo/app row. Public slash form plus internal `--` form
 * so path matching works against both `publicHref` and `location.pathname`.
 */
export function repoBasePaths(repo: RepoWithLogo): string[] {
  const slash = repoHref(repo.owner, repo.name, repo.rootDirectory);
  if (!repo.rootDirectory) return [slash];
  const leaf = repo.rootDirectory.split("/").pop();
  if (!leaf) return [slash];
  const internal = `/${repo.owner}/${repo.name}--${leaf}`;
  return slash === internal ? [slash] : [slash, internal];
}

/** Sessions index URL for an app (`â€¦/sessions` composer landing). */
export function repoSessionsIndexPath(repo: RepoWithLogo): string {
  return `${repoHref(repo.owner, repo.name, repo.rootDirectory)}/sessions`;
}

/**
 * Where the rail's Sessions entry lands. `repos` is `githubRepos.list` order —
 * the same order the rail paints its tiles and `RailAppHotkeys` numbers its
 * slots, so this is the app behind tile 1 / ⌘1 rather than a third ordering.
 * `null` when the user has no apps; callers send those users to `/home`.
 */
export function firstRepoSessionsPath(
  repos: readonly RepoWithLogo[],
): string | null {
  const first = repos[0];
  return first ? repoSessionsIndexPath(first) : null;
}

/** Whether `pathname` is under this repo/app (any sub-page). */
export function repoMatchesPath(repo: RepoWithLogo, pathname: string): boolean {
  return repoBasePaths(repo).some(
    (base) => pathname === base || pathname.startsWith(`${base}/`),
  );
}

/**
 * Whether `pathname` is this session under the app. Checks slash + `--`
 * bases â€” `location.pathname` is the router-internal form.
 */
export function sessionMatchesPath(
  repo: RepoWithLogo,
  pathSegment: string | null | undefined,
  pathname: string,
): boolean {
  if (!pathSegment) return false;
  return repoBasePaths(repo).some((base) => {
    const href = `${base}/sessions/${pathSegment}`;
    return pathname === href || pathname.startsWith(`${href}/`);
  });
}
