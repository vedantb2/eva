import { NextRequest, NextResponse } from "next/server";
import { api } from "conductor-backend";
import { createConvex } from "@/lib/convex-auth";
import { auth } from "@clerk/nextjs/server";
import type { Id } from "conductor-backend";
import {
  getSandbox,
  WORKSPACE_DIR,
  getPtyWebSocketUrl,
} from "@/lib/inngest/sandbox";

export async function GET(request: NextRequest) {
  const { userId, getToken } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clerkToken = await getToken({ template: "convex" });
  const convex = createConvex(clerkToken ?? undefined);

  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get("sessionId");
  const cols = parseInt(searchParams.get("cols") || "120", 10);
  const rows = parseInt(searchParams.get("rows") || "30", 10);

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
    const sandbox = await getSandbox(session.sandboxId);
    let ptyId = session.ptySessionId;

    if (!ptyId) {
      ptyId = `pty-${sessionId.slice(-8)}`;
      try {
        const handle = await sandbox.process.createPty({
          id: ptyId,
          cols,
          rows,
          cwd: WORKSPACE_DIR,
          envs: { TERM: "xterm-256color" },
          onData: () => {},
        });
        await handle.disconnect();
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : String(e);
        if (errMsg.includes("already exists")) {
          await sandbox.process.killPtySession(ptyId);
          const handle = await sandbox.process.createPty({
            id: ptyId,
            cols,
            rows,
            cwd: WORKSPACE_DIR,
            envs: { TERM: "xterm-256color" },
            onData: () => {},
          });
          await handle.disconnect();
        } else {
          throw e;
        }
      }

      await convex.mutation(api.sessions.updatePtySession, {
        id: sessionId as Id<"sessions">,
        ptySessionId: ptyId,
      });
    }

    const wsUrl = await getPtyWebSocketUrl(sandbox, ptyId);

    return NextResponse.json({ wsUrl, ptySessionId: ptyId });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("PTY error:", errorMessage);
    return NextResponse.json(
      { error: `PTY error: ${errorMessage}` },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const { userId, getToken } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clerkToken = await getToken({ template: "convex" });
  const convex = createConvex(clerkToken ?? undefined);

  const body = await request.json();
  const { sessionId, cols, rows, action } = body;

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

  const ptyId = session.ptySessionId || `pty-${sessionId.slice(-8)}`;

  try {
    if (action === "resize" && cols && rows) {
      const sandbox = await getSandbox(session.sandboxId);
      await sandbox.process.resizePtySession(ptyId, cols, rows);
      return NextResponse.json({ success: true });
    }

    if (action === "disconnect") {
      const sandbox = await getSandbox(session.sandboxId);
      await sandbox.process.killPtySession(ptyId).catch(() => {});
      await convex.mutation(api.sessions.updatePtySession, {
        id: sessionId as Id<"sessions">,
        ptySessionId: "",
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("PTY error:", errorMessage);
    return NextResponse.json(
      { error: `PTY error: ${errorMessage}` },
      { status: 500 },
    );
  }
}
