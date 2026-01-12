import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/api";
import { getAppOctokit, listInstallationRepos } from "@/lib/github/client";

export async function POST() {
  const { getToken } = await auth();
  const token = await getToken({ template: "convex" });

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
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
        } catch {
        }
      }
    }

    return NextResponse.json({ synced: totalAdded });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}
