import { NextResponse } from "next/server";
import { createBranch } from "@/lib/github/client";

export async function POST(req: Request) {
  try {
    const { owner, repo, branchName, baseBranch = "main", installationId } = await req.json();

    if (!owner || !repo || !branchName || !installationId) {
      return NextResponse.json(
        { error: "Missing required fields: owner, repo, branchName, installationId" },
        { status: 400 }
      );
    }

    const branch = await createBranch({
      installationId,
      owner,
      repo,
      branchName,
      baseBranch,
    });

    return NextResponse.json({
      success: true,
      message: "Branch created: " + branch.name + " from " + branch.baseBranch,
      branch,
    });
  } catch (error) {
    console.error("Error creating branch:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create branch" },
      { status: 500 }
    );
  }
}
