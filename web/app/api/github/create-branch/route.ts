import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { owner, repo, branchName, baseBranch = "main" } = await req.json();

    if (!owner || !repo || !branchName) {
      return NextResponse.json(
        { error: "Missing required fields: owner, repo, branchName" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Branch creation prepared: ${branchName} from ${baseBranch}`,
      branch: {
        name: branchName,
        fullRef: `refs/heads/${branchName}`,
        baseBranch,
      },
    });
  } catch (error) {
    console.error("Error creating branch:", error);
    return NextResponse.json(
      { error: "Failed to create branch" },
      { status: 500 }
    );
  }
}
