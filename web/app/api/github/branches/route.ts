import { NextResponse } from "next/server";
import { listBranches } from "@/lib/github/client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");
  const installationId = searchParams.get("installationId");

  if (!owner || !repo || !installationId) {
    return NextResponse.json(
      { error: "Missing required params: owner, repo, installationId" },
      { status: 400 }
    );
  }

  try {
    const branches = await listBranches({
      installationId: Number(installationId),
      owner,
      repo,
    });
    return NextResponse.json({ branches });
  } catch (error) {
    console.error("Error fetching branches:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch branches" },
      { status: 500 }
    );
  }
}
