import { NextResponse } from "next/server";
import { getAppOctokit } from "@/lib/github/client";

export async function GET() {
  try {
    const octokit = getAppOctokit();
    const installations = await octokit.rest.apps.listInstallations();
    
    return NextResponse.json({
      installations: installations.data.map((inst) => ({
        id: inst.id,
        account: inst.account?.login,
        repositorySelection: inst.repository_selection,
        createdAt: inst.created_at,
      })),
    });
  } catch (error) {
    console.error("Error listing installations:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list installations" },
      { status: 500 }
    );
  }
}
