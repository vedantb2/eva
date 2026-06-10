import type { Id } from "@conductor/backend";
import { api } from "@conductor/backend";
import type { ConvexHttpClient } from "./convex";

export class NoRepoMatchError extends Error {
  constructor(host: string) {
    super(`No repo mapped to domain "${host}"`);
    this.name = "NoRepoMatchError";
  }
}

function getHostFromUrl(url: string): string | null {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

function domainMatches(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`);
}

function findBestMatchingRepo(
  host: string,
  domainToRepoId: Map<string, Id<"githubRepos">>,
): Id<"githubRepos"> | null {
  let bestMatch: { domain: string; repoId: Id<"githubRepos"> } | null = null;
  for (const [domain, repoId] of domainToRepoId) {
    if (
      domainMatches(host, domain) &&
      (!bestMatch || domain.length > bestMatch.domain.length)
    ) {
      bestMatch = { domain, repoId };
    }
  }
  return bestMatch?.repoId ?? null;
}

function buildDomainMap(
  repos: Array<{
    _id: Id<"githubRepos">;
    domains?: string[];
  }>,
): Map<string, Id<"githubRepos">> {
  const map = new Map<string, Id<"githubRepos">>();
  for (const repo of repos) {
    if (repo.domains) {
      for (const raw of repo.domains) {
        let hostname = raw;
        try {
          const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
          hostname = url.hostname;
        } catch {
          // already a plain hostname
        }
        map.set(hostname, repo._id);
      }
    }
  }
  return map;
}

export async function resolveRepoForUrl(
  client: ConvexHttpClient,
  pageUrl: string,
): Promise<{
  repoId: Id<"githubRepos">;
  repos: Array<{
    _id: Id<"githubRepos">;
    owner: string;
    name: string;
    domains?: string[];
  }>;
}> {
  const host = getHostFromUrl(pageUrl);
  if (!host) throw new NoRepoMatchError(pageUrl);
  const repos = await client.query(api.githubRepos.list, {});
  const domainMap = buildDomainMap(repos);
  const repoId = findBestMatchingRepo(host, domainMap);
  if (!repoId) throw new NoRepoMatchError(host);
  return { repoId, repos };
}
