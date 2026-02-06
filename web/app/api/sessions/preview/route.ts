import { NextRequest, NextResponse } from "next/server";
import { Daytona } from "@daytonaio/sdk";
import { createClerkClient } from "@clerk/backend";
import { api } from "@/api";
import { createConvex } from "@/lib/convex-auth";
import { auth } from "@clerk/nextjs/server";
import { serverEnv } from "@/env/server";
import { GenericId as Id } from "convex/values";

const daytona = new Daytona({ apiKey: serverEnv.DAYTONA_API_KEY });
const clerk = createClerkClient({ secretKey: serverEnv.CLERK_SECRET_KEY });

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

    const signInToken = await clerk.signInTokens.createSignInToken({
      userId: serverEnv.SANDBOX_CLERK_USER_ID,
      expiresInSeconds: 300,
    });

    const previewOrigin = new URL(signedPreview.url).origin;
    const authUrl = `${previewOrigin}/sandbox-auth?ticket=${signInToken.token}&redirect=${encodeURIComponent("/")}`;

    return NextResponse.json({ url: authUrl, port });
  } catch (error) {
    console.error("Failed to get preview link:", error);
    return NextResponse.json(
      { error: "Failed to get preview link" },
      { status: 500 },
    );
  }
}
