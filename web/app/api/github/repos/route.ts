import { NextResponse } from "next/server";
import { listInstallationRepos } from "@/lib/github/client";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const installationId = url.searchParams.get("installation_id");

  if (!installationId) {
    return NextResponse.json(
      { error: "Missing installation_id" },
      { status: 400 }
    );
  }

  try {
    const repos = await listInstallationRepos(Number(installationId));
    return NextResponse.json({ repos });
  } catch (error) {
    console.error("Error fetching repos:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch repos" },
      { status: 500 }
    );
  }
}
