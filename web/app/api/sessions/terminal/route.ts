import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { Daytona } from "@daytonaio/sdk";
import { api } from "@/api";
import { clientEnv } from "@/env/client";
import { auth } from "@clerk/nextjs/server";
import { GenericId as Id } from "convex/values";

const convex = new ConvexHttpClient(clientEnv.NEXT_PUBLIC_CONVEX_URL);
const daytona = new Daytona();

const activePtyHandles = new Map<string, ReturnType<typeof createPtyConnection>>();

async function createPtyConnection(sandbox: Awaited<ReturnType<typeof daytona.get>>, ptyId: string, cols: number, rows: number) {
  const outputBuffer: string[] = [];
  let isConnected = false;

  const ptyHandle = await sandbox.process.createPty({
    id: ptyId,
    cols,
    rows,
    cwd: "/home/daytona/workspace",
    onData: (data) => {
      const text = new TextDecoder().decode(data);
      outputBuffer.push(text);
      if (outputBuffer.length > 1000) {
        outputBuffer.shift();
      }
    },
  });

  await ptyHandle.waitForConnection();
  isConnected = true;

  return {
    ptyHandle,
    getOutput: () => {
      const output = outputBuffer.join("");
      outputBuffer.length = 0;
      return output;
    },
    sendInput: (input: string) => ptyHandle.sendInput(input),
    isConnected: () => isConnected,
    disconnect: async () => {
      isConnected = false;
      await ptyHandle.disconnect();
    },
  };
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { sessionId, cols, rows, input, action } = body;

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  const session = await convex.query(api.sessions.getNoAuth, {
    id: sessionId as Id<"sessions">,
  });
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (!session.sandboxId) {
    return NextResponse.json({ error: "Sandbox not active" }, { status: 400 });
  }

  const ptyKey = `${session.sandboxId}-${sessionId}`;
  const ptyId = session.ptySessionId || `pty-${sessionId.slice(-8)}`;

  try {
    if (action === "disconnect") {
      const connection = activePtyHandles.get(ptyKey);
      if (connection) {
        await connection.disconnect();
        activePtyHandles.delete(ptyKey);
      }
      return NextResponse.json({ success: true });
    }

    if (action === "input" && input) {
      const connection = activePtyHandles.get(ptyKey);
      if (connection && connection.isConnected()) {
        await connection.sendInput(input);
        await new Promise((r) => setTimeout(r, 50));
        return NextResponse.json({
          success: true,
          output: connection.getOutput()
        });
      }
      return NextResponse.json({ error: "PTY not connected" }, { status: 400 });
    }

    if (action === "poll") {
      const connection = activePtyHandles.get(ptyKey);
      if (connection && connection.isConnected()) {
        return NextResponse.json({
          connected: true,
          output: connection.getOutput()
        });
      }
      return NextResponse.json({ connected: false, output: "" });
    }

    let connection = activePtyHandles.get(ptyKey);
    if (!connection || !connection.isConnected()) {
      const sandbox = await daytona.get(session.sandboxId);

      try {
        connection = await createPtyConnection(sandbox, ptyId, cols || 120, rows || 30);
        activePtyHandles.set(ptyKey, connection);
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : String(e);
        if (errMsg.includes("already exists")) {
          await sandbox.process.killPtySession(ptyId);
          connection = await createPtyConnection(sandbox, ptyId, cols || 120, rows || 30);
          activePtyHandles.set(ptyKey, connection);
        } else {
          throw e;
        }
      }

      if (!session.ptySessionId) {
        await convex.mutation(api.sessions.updatePtySessionNoAuth, {
          id: sessionId as Id<"sessions">,
          ptySessionId: ptyId,
        });
      }
    }

    await new Promise((r) => setTimeout(r, 100));

    return NextResponse.json({
      ptySessionId: ptyId,
      sandboxId: session.sandboxId,
      connected: true,
      output: connection.getOutput(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("PTY error:", errorMessage);
    return NextResponse.json(
      { error: `PTY error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
