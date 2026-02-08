import { NextResponse } from "next/server";
import { listInstallationRepos } from "@/lib/github/client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const repos = await listInstallationRepos(Number(id));
    return NextResponse.json({ repos });
  } catch (error) {
    console.error("Error fetching repos:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch repos",
      },
      { status: 500 },
    );
  }
}
