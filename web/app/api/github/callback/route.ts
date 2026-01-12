import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/api";
import { clientEnv } from "@/env/client";
import { listInstallationRepos } from "@/lib/github/client";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const installationId = url.searchParams.get("installation_id");

  if (!installationId) {
    return NextResponse.redirect(new URL("/repos?error=no_installation", req.url));
  }

  const { getToken } = await auth();
  const token = await getToken({ template: "convex" });

  if (!token) {
    return NextResponse.redirect(
      new URL("/repos/setup/" + installationId, req.url)
    );
  }

  try {
    const convex = new ConvexHttpClient(clientEnv.NEXT_PUBLIC_CONVEX_URL);
    convex.setAuth(token);

    const repos = await listInstallationRepos(Number(installationId));

    let added = 0;
    for (const repo of repos) {
      try {
        await convex.mutation(api.githubRepos.create, {
          owner: repo.owner,
          name: repo.name,
          installationId: Number(installationId),
        });
        added++;
      } catch {
      }
    }

    return NextResponse.redirect(new URL("/repos?synced=" + added, req.url));
  } catch (error) {
    console.error("GitHub callback error:", error);
    return NextResponse.redirect(
      new URL("/repos/setup/" + installationId, req.url)
    );
  }
}
