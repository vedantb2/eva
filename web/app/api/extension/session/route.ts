import { ConvexHttpClient } from "convex/browser";
import { NextRequest, NextResponse } from "next/server";
import { api } from "@/api";
import { clientEnv } from "@/env/client";
import { GenericId as Id } from "convex/values";
import { validateAuth } from "../validate-auth";

const convex = new ConvexHttpClient(clientEnv.NEXT_PUBLIC_CONVEX_URL);

export async function GET(request: NextRequest) {
  const authResult = await validateAuth(request);

  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const repoId = searchParams.get("repoId");

  if (!repoId) {
    return NextResponse.json({ error: "Missing repoId" }, { status: 400 });
  }

  try {
    const session = await convex.mutation(
      api.sessions.getOrCreateExtensionSession,
      {
        repoId: repoId as Id<"githubRepos">,
        clerkId: authResult.userId,
      },
    );

    return NextResponse.json(session);
  } catch (error) {
    console.error("Failed to get or create extension session:", error);
    return NextResponse.json(
      { error: "Failed to get session" },
      { status: 500 },
    );
  }
}
