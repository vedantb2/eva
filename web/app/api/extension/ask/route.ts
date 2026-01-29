import { NextRequest, NextResponse } from "next/server";
import { api } from "@/api";
import { createConvex } from "@/lib/convex-auth";
import { GenericId as Id } from "convex/values";
import { inngest } from "@/lib/inngest";
import { validateAuth } from "../validate-auth";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  const authResult = await validateAuth(request);

  if (!authResult) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: corsHeaders },
    );
  }

  const convex = createConvex(authResult.token);

  const { sessionId, message, contextMessage } = await request.json();
  if (!sessionId || !message) {
    return NextResponse.json({ error: "Missing sessionId or message" }, { status: 400, headers: corsHeaders });
  }

  const session = await convex.query(api.sessions.get, {
    id: sessionId as Id<"sessions">,
  });
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404, headers: corsHeaders });
  }

  const repo = await convex.query(api.githubRepos.get, {
    id: session.repoId,
  });
  if (!repo) {
    return NextResponse.json({ error: "Repository not found" }, { status: 404, headers: corsHeaders });
  }

  await inngest.send({
    name: "session/ask.execute",
    data: {
      sessionId,
      messageContent: (contextMessage as string) || message,
      repoId: session.repoId,
      installationId: repo.installationId,
      clerkToken: authResult.token,
    },
  });

  return NextResponse.json({ success: true }, { headers: corsHeaders });
}
