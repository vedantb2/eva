import { ConvexHttpClient } from "convex/browser";
import { NextRequest, NextResponse } from "next/server";
import { api } from "@/api";
import { clientEnv } from "@/env/client";
import { GenericId as Id } from "convex/values";
import { inngest } from "@/lib/inngest";
import { validateAuth } from "../validate-auth";

const convex = new ConvexHttpClient(clientEnv.NEXT_PUBLIC_CONVEX_URL);

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

  const { sessionId, message, contextMessage } = await request.json();
  if (!sessionId || !message) {
    return NextResponse.json({ error: "Missing sessionId or message" }, { status: 400, headers: corsHeaders });
  }

  const session = await convex.query(api.sessions.getNoAuth, {
    id: sessionId as Id<"sessions">,
  });
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404, headers: corsHeaders });
  }

  const repo = await convex.query(api.githubRepos.getNoAuth, {
    id: session.repoId,
  });
  if (!repo) {
    return NextResponse.json({ error: "Repository not found" }, { status: 404, headers: corsHeaders });
  }

  await convex.mutation(api.sessions.addMessageNoAuth, {
    id: sessionId as Id<"sessions">,
    role: "user",
    content: message,
    mode: "ask",
  });

  await inngest.send({
    name: "session/ask.execute",
    data: {
      sessionId,
      messageContent: (contextMessage as string) || message,
      repoId: session.repoId,
      installationId: repo.installationId,
    },
  });

  return NextResponse.json({ success: true }, { headers: corsHeaders });
}
