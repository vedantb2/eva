import { NextRequest, NextResponse } from "next/server";
import { api } from "@/api";
import { createConvex } from "@/lib/convex-auth";
import { inngest } from "@/lib/inngest";
import { auth } from "@clerk/nextjs/server";
import { GenericId as Id } from "convex/values";

export async function POST(request: NextRequest) {
  const { getToken } = await auth();
  const clerkToken = await getToken({ template: "convex" });
  if (!clerkToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const convex = createConvex(clerkToken);

  const { sessionId, message, mode = "execute", generatePlan = false } =
    await request.json();
  if (!sessionId || !message) {
    return NextResponse.json(
      { error: "Missing sessionId or message" },
      { status: 400 }
    );
  }

  const session = await convex.query(api.sessions.get, {
    id: sessionId as Id<"sessions">,
  });
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const repo = await convex.query(api.githubRepos.get, {
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
        clerkToken,
        sessionId,
        repoId: session.repoId,
        installationId: repo.installationId,
      },
    });
  } else if (mode === "ask") {
    await inngest.send({
      name: "session/ask.execute",
      data: {
        clerkToken,
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
        clerkToken,
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
        clerkToken,
        sessionId,
        messageContent: message,
        repoId: session.repoId,
        installationId: repo.installationId,
      },
    });
  }

  return NextResponse.json({ success: true });
}
