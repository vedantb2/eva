import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createConvex } from "@/lib/convex-auth";
import { createPullRequest } from "@/lib/github/client";
import { api } from "conductor-backend";
import type { Id } from "conductor-backend";

export async function POST(request: NextRequest) {
  const { userId, getToken } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clerkToken = await getToken({ template: "convex" });
  const convex = createConvex(clerkToken ?? undefined);

  const { sessionId } = await request.json();

  const session = await convex.query(api.sessions.get, {
    id: sessionId as Id<"sessions">,
  });
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (!session.branchName) {
    return NextResponse.json(
      { error: "No branch associated with this session" },
      { status: 400 },
    );
  }
  if (session.prUrl) {
    return NextResponse.json({ url: session.prUrl });
  }

  const repo = await convex.query(api.githubRepos.get, { id: session.repoId });
  if (!repo) {
    return NextResponse.json(
      { error: "Repository not found" },
      { status: 404 },
    );
  }

  const pr = await createPullRequest({
    installationId: repo.installationId,
    owner: repo.owner,
    repo: repo.name,
    title: session.title,
    body: `Session: ${session.title}\n\n---\n*Created by Eva AI Agent*`,
    head: session.branchName,
    base: "main",
  });

  await convex.mutation(api.sessions.updateSandbox, {
    id: sessionId as Id<"sessions">,
    prUrl: pr.url,
  });

  return NextResponse.json({ url: pr.url });
}
