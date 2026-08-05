import { repoHref } from "@/lib/utils/repoUrl";
import type { RepoWithLogo } from "@/lib/utils/repoGrouping";

/**
 * Base path(s) for a repo/app row. Public slash form plus internal `--` form
 * so path matching works against both `publicHref` and `location.pathname`.
 */
export function repoSessionBasePaths(repo: RepoWithLogo): string[] {
  const slash = repoHref(repo.owner, repo.name, repo.rootDirectory);
  if (!repo.rootDirectory) return [slash];
  const leaf = repo.rootDirectory.split("/").pop();
  if (!leaf) return [slash];
  const internal = `/${repo.owner}/${repo.name}--${leaf}`;
  return slash === internal ? [slash] : [slash, internal];
}

/** Sessions index URL for an app (`…/sessions` composer landing). */
export function repoSessionsIndexPath(repo: RepoWithLogo): string {
  return `${repoHref(repo.owner, repo.name, repo.rootDirectory)}/sessions`;
}

/** Whether `pathname` is under this repo/app (any sub-page). */
export function repoMatchesPath(repo: RepoWithLogo, pathname: string): boolean {
  return repoSessionBasePaths(repo).some(
    (base) => pathname === base || pathname.startsWith(`${base}/`),
  );
}

/**
 * Whether `pathname` is this session under the app. Checks slash + `--`
 * bases — `location.pathname` is the router-internal form.
 */
export function sessionMatchesPath(
  repo: RepoWithLogo,
  pathSegment: string | null | undefined,
  pathname: string,
): boolean {
  if (!pathSegment) return false;
  return repoSessionBasePaths(repo).some((base) => {
    const href = `${base}/sessions/${pathSegment}`;
    return pathname === href || pathname.startsWith(`${href}/`);
  });
}
