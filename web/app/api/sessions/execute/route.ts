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

  const { sessionId, message, mode = "execute", generatePlan = false } =
    await request.json();
  if (!sessionId || !message) {
    return NextResponse.json(
      { error: "Missing sessionId or message" },
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

  const isPrCommand =
    message.toLowerCase().includes("create pr") ||
    message.toLowerCase().includes("create a pr") ||
    message.toLowerCase().includes("open pr") ||
    message.toLowerCase().includes("make pr");

  if (isPrCommand && mode === "execute") {
    await inngest.send({
      name: "session/pr.create",
      data: {
        sessionId,
        repoId: session.repoId,
        installationId: repo.installationId,
      },
    });
  } else if (mode === "ask") {
    await inngest.send({
      name: "session/ask.execute",
      data: {
        sessionId,
        messageContent: message,
        repoId: session.repoId,
        installationId: repo.installationId,
      },
    });
  } else if (mode === "plan") {
    await inngest.send({
      name: "session/plan.execute",
      data: {
        sessionId,
        messageContent: message,
        repoId: session.repoId,
        installationId: repo.installationId,
        generatePlan,
      },
    });
  } else {
    await inngest.send({
      name: "session/task.execute",
      data: {
        sessionId,
        messageContent: message,
        repoId: session.repoId,
        installationId: repo.installationId,
      },
    });
  }

  return NextResponse.json({ success: true });
}
