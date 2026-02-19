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
  const designSessionId = searchParams.get("designSessionId");
  const port = parseInt(searchParams.get("port") || "3000", 10);

  if (!designSessionId) {
    return NextResponse.json(
      { error: "Missing designSessionId" },
      { status: 400 },
    );
  }

  const session = await convex.query(api.designSessions.get, {
    id: designSessionId as Id<"designSessions">,
  });
  if (!session) {
    return NextResponse.json(
      { error: "Design session not found" },
      { status: 404 },
    );
  }

  if (!session.sandboxId) {
    return NextResponse.json({ error: "Sandbox not active" }, { status: 400 });
  }

  try {
    const sandbox = await daytona.get(session.sandboxId);
    const signedPreview = await sandbox.getSignedPreviewUrl(port, 3600);

    let ready = true;
    if (searchParams.get("check") === "1") {
      try {
        const check = await sandbox.process.executeCommand(
          `curl -s -o /dev/null -w "%{http_code}" http://localhost:${port}`,
          "/",
          undefined,
          3,
        );
        const code = parseInt(check.result?.trim() || "0", 10);
        ready = code >= 200 && code < 500;
      } catch {
        ready = false;
      }
    }

    return NextResponse.json({ url: signedPreview.url, port, ready });
  } catch (error) {
    console.error("Failed to get design preview link:", error);
    return NextResponse.json(
      { error: "Failed to get preview link" },
      { status: 500 },
    );
  }
}
