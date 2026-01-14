import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/api";
import { clientEnv } from "@/env/client";
import { inngest } from "@/lib/inngest";
import { auth } from "@clerk/nextjs/server";
import { GenericId as Id } from "convex/values";

const convex = new ConvexHttpClient(clientEnv.NEXT_PUBLIC_CONVEX_URL);

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId, action } = await request.json();
  if (!sessionId || !action) {
    return NextResponse.json(
      { error: "Missing sessionId or action" },
      { status: 400 }
    );
  }

  if (action !== "start" && action !== "stop") {
    return NextResponse.json(
      { error: "Invalid action. Must be 'start' or 'stop'" },
      { status: 400 }
    );
  }

  const session = await convex.query(api.sessions.getNoAuth, {
    id: sessionId as Id<"sessions">,
  });
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const repo = await convex.query(api.githubRepos.getNoAuth, {
    id: session.repoId,
  });
  if (!repo) {
    return NextResponse.json({ error: "Repository not found" }, { status: 404 });
  }

  if (action === "start") {
    await inngest.send({
      name: "session/sandbox.start",
      data: {
        sessionId,
        repoId: session.repoId,
        installationId: repo.installationId,
      },
    });
  } else {
    await convex.mutation(api.sessions.updateStatusNoAuth, {
      id: sessionId as Id<"sessions">,
      status: "closed",
    });

    if (session.sandboxId) {
      await inngest.send({
        name: "session/cleanup.requested",
        data: { sandboxId: session.sandboxId, sessionId },
      });
    }
  }

  return NextResponse.json({ success: true });
}