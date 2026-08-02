import { repoHref } from "@/lib/utils/repoUrl";
import type { RepoWithLogo } from "@/lib/utils/repoGrouping";

/**
 * Base path(s) for a repo/app row. Internal `--` form plus public slash form
 * so path matching works against both `location.href` and `publicHref`.
 */
export function repoSessionBasePaths(repo: RepoWithLogo): string[] {
  const encoded = repoHref(repo.owner, repo.name, repo.rootDirectory);
  if (!repo.rootDirectory) return [encoded];
  const leaf = repo.rootDirectory.split("/").pop();
  if (!leaf) return [encoded];
  const slash = `/${repo.owner}/${repo.name}/${leaf}`;
  return encoded === slash ? [encoded] : [encoded, slash];
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
