"use server";

import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@conductor/backend";
import { clientEnv } from "@/env/client";
import { getAppOctokit, listInstallationRepos } from "@/lib/github/client";

export async function syncGitHubRepos(): Promise<{
  success: boolean;
  synced?: number;
  error?: string;
}> {
  const { getToken } = await auth();
  const token = await getToken({ template: "convex" });

  if (!token) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    const convex = new ConvexHttpClient(clientEnv.NEXT_PUBLIC_CONVEX_URL);
    convex.setAuth(token);

    const octokit = getAppOctokit();
    const installations = await octokit.rest.apps.listInstallations();

    let totalAdded = 0;

    for (const installation of installations.data) {
      const repos = await listInstallationRepos(installation.id);

      for (const repo of repos) {
        try {
          await convex.mutation(api.githubRepos.create, {
            owner: repo.owner,
            name: repo.name,
            installationId: installation.id,
          });
          totalAdded++;
        } catch {}
      }
    }

    return { success: true, synced: totalAdded };
  } catch (error) {
    console.error("Sync error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Sync failed",
    };
  }
}
