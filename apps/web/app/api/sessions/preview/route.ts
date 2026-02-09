import { NextRequest, NextResponse } from "next/server";
import { Daytona } from "@daytonaio/sdk";
import { api } from "@conductor/backend";
import { createConvex } from "@/lib/convex-auth";
import { auth } from "@clerk/nextjs/server";
import { serverEnv } from "@/env/server";
import type { Id } from "@conductor/backend";

const daytona = new Daytona({ apiKey: serverEnv.DAYTONA_API_KEY });

export async function GET(request: NextRequest) {
  const { userId, getToken } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clerkToken = await getToken({ template: "convex" });
  const convex = createConvex(clerkToken ?? undefined);

  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get("sessionId");
  const port = parseInt(searchParams.get("port") || "3000", 10);

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  const session = await convex.query(api.sessions.get, {
    id: sessionId as Id<"sessions">,
  });
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (!session.sandboxId) {
    return NextResponse.json({ error: "Sandbox not active" }, { status: 400 });
  }

  try {
    const sandbox = await daytona.get(session.sandboxId);
    const signedPreview = await sandbox.getSignedPreviewUrl(port, 3600);

    return NextResponse.json({ url: signedPreview.url, port });
  } catch (error) {
    console.error("Failed to get preview link:", error);
    return NextResponse.json(
      { error: "Failed to get preview link" },
      { status: 500 },
    );
  }
}
