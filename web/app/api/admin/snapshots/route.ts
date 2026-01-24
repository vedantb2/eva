import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { createAppAuth } from "@octokit/auth-app";
import { api } from "@/api";
import { clientEnv } from "@/env/client";
import { serverEnv } from "@/env/server";
import {
  listSnapshots,
  getSnapshot,
  deleteSnapshot,
  refreshSnapshot,
  getSnapshotName,
} from "@/lib/inngest/snapshots";
import { GenericId as Id } from "convex/values";

const convex = new ConvexHttpClient(clientEnv.NEXT_PUBLIC_CONVEX_URL);

async function getGitHubToken(installationId: number): Promise<string> {
  const auth = createAppAuth({
    appId: serverEnv.GITHUB_APP_ID,
    privateKey: serverEnv.GITHUB_PRIVATE_KEY,
    clientId: serverEnv.GITHUB_CLIENT_ID,
    clientSecret: serverEnv.GITHUB_CLIENT_SECRET,
  });
  const { token } = await auth({ type: "installation", installationId });
  return token;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const snapshots = await listSnapshots();
    return NextResponse.json({ snapshots });
  } catch (error) {
    console.error("Error listing snapshots:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list snapshots" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action, repoId, branch } = await request.json();

  if (!action || !repoId || !branch) {
    return NextResponse.json(
      { error: "Missing required fields: action, repoId, branch" },
      { status: 400 }
    );
  }

  const repo = await convex.query(api.githubRepos.getNoAuth, {
    id: repoId as Id<"githubRepos">,
  });

  if (!repo) {
    return NextResponse.json({ error: "Repository not found" }, { status: 404 });
  }

  const githubToken = await getGitHubToken(repo.installationId);
  const snapshotName = getSnapshotName(repo.owner, repo.name, branch);

  try {
    if (action === "create" || action === "refresh") {
      const snapshot = await refreshSnapshot(
        repo.owner,
        repo.name,
        branch,
        githubToken,
        (log) => console.log(`[Snapshot ${snapshotName}]`, log)
      );
      return NextResponse.json({
        success: true,
        snapshot: { name: snapshot.name, state: snapshot.state },
      });
    }

    if (action === "delete") {
      await deleteSnapshot(snapshotName);
      return NextResponse.json({ success: true });
    }

    if (action === "check") {
      const snapshot = await getSnapshot(snapshotName);
      return NextResponse.json({
        exists: !!snapshot,
        snapshot: snapshot ? { name: snapshot.name, state: snapshot.state } : null,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error managing snapshot:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to manage snapshot" },
      { status: 500 }
    );
  }
}
