"use node";

import type { Octokit } from "octokit";

/** Extracts the PR number from a GitHub PR URL. */
export function extractPrNumber(prUrl: string): number | null {
  const match = prUrl.match(/\/pull\/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/** Scans the apps/ directory of a repo to detect monorepo sub-applications. */
export async function detectAppsForRepo(
  octokit: Octokit,
  owner: string,
  name: string,
): Promise<Array<{ name: string; path: string; hasDevScript: boolean }>> {
  const apps: Array<{ name: string; path: string; hasDevScript: boolean }> = [];

  try {
    const { data: entries } = await octokit.rest.repos.getContent({
      owner,
      repo: name,
      path: "apps",
    });

    if (!Array.isArray(entries)) return [];

    for (const entry of entries) {
      if (entry.type !== "dir") continue;
      const appPath = `apps/${entry.name}`;
      let hasDevScript = false;
      try {
        const { data: appPkg } = await octokit.rest.repos.getContent({
          owner,
          repo: name,
          path: `${appPath}/package.json`,
        });
        if ("content" in appPkg) {
          const decoded = Buffer.from(appPkg.content, "base64").toString();
          const pkg: Record<string, unknown> = JSON.parse(decoded);
          const scripts =
            pkg.scripts && typeof pkg.scripts === "object"
              ? (pkg.scripts as Record<string, unknown>)
              : {};
          hasDevScript = typeof scripts.dev === "string";
        }
      } catch {
        // no package.json in this app dir
      }
      apps.push({ name: entry.name, path: appPath, hasDevScript });
    }
  } catch {
    // apps/ directory doesn't exist — not a monorepo with apps
  }

  return apps;
}
