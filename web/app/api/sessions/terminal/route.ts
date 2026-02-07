import { NextRequest, NextResponse } from "next/server";
import { Sandbox } from "@daytonaio/sdk";
import { api } from "@/api";
import { createConvex } from "@/lib/convex-auth";
import { auth } from "@clerk/nextjs/server";
import { GenericId as Id } from "convex/values";
import { getSandbox, WORKSPACE_DIR } from "@/lib/inngest/sandbox";

type PtyConnection = {
  getOutput: () => string;
  sendInput: (input: string) => Promise<void>;
  isConnected: () => boolean;
  disconnect: () => Promise<void>;
};

const activePtyHandles = new Map<string, PtyConnection>();

function createBufferedHandlers() {
  const outputBuffer: string[] = [];
  let connected = false;
  return {
    onData: (data: Uint8Array) => {
      const text = new TextDecoder().decode(data);
      outputBuffer.push(text);
      if (outputBuffer.length > 1000) outputBuffer.shift();
    },
    getOutput: () => {
      const output = outputBuffer.join("");
      outputBuffer.length = 0;
      return output;
    },
    setConnected: (v: boolean) => {
      connected = v;
    },
    isConnected: () => connected,
  };
}

async function createPtyConnection(
  sandbox: Sandbox,
  ptyId: string,
  cols: number,
  rows: number,
): Promise<PtyConnection> {
  const buf = createBufferedHandlers();

  const ptyHandle = await sandbox.process.createPty({
    id: ptyId,
    cols,
    rows,
    cwd: WORKSPACE_DIR,
    envs: { TERM: "xterm-256color" },
    onData: buf.onData,
  });

  await ptyHandle.waitForConnection();
  buf.setConnected(true);

  return {
    getOutput: buf.getOutput,
    sendInput: (input: string) => ptyHandle.sendInput(input),
    isConnected: buf.isConnected,
    disconnect: async () => {
      buf.setConnected(false);
      await ptyHandle.disconnect();
    },
  };
}

async function reconnectPtyConnection(
  sandbox: Sandbox,
  ptyId: string,
): Promise<PtyConnection> {
  const buf = createBufferedHandlers();

  const ptyHandle = await sandbox.process.connectPty(ptyId, {
    onData: buf.onData,
  });

  await ptyHandle.waitForConnection();
  buf.setConnected(true);

  return {
    getOutput: buf.getOutput,
    sendInput: (input: string) => ptyHandle.sendInput(input),
    isConnected: buf.isConnected,
    disconnect: async () => {
      buf.setConnected(false);
      await ptyHandle.disconnect();
    },
  };
}

async function getOrReconnectPty(
  sandboxId: string,
  ptyKey: string,
  ptyId: string,
): Promise<PtyConnection | null> {
  const existing = activePtyHandles.get(ptyKey);
  if (existing && existing.isConnected()) return existing;

  try {
    const sandbox = await getSandbox(sandboxId);
    const connection = await reconnectPtyConnection(sandbox, ptyId);
    activePtyHandles.set(ptyKey, connection);
    return connection;
  } catch {
    return null;
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
  const { sessionId, cols, rows, input, action } = body;

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

    if (action === "resize" && cols && rows) {
      const sandbox = await getSandbox(session.sandboxId);
      await sandbox.process.resizePtySession(ptyId, cols, rows);
      return NextResponse.json({ success: true });
    }

    if (action === "input" && input) {
      const connection = await getOrReconnectPty(
        session.sandboxId,
        ptyKey,
        ptyId,
      );
      if (connection) {
        await connection.sendInput(input);
        return NextResponse.json({
          success: true,
          output: connection.getOutput(),
        });
      }
      return NextResponse.json({ error: "PTY not connected" }, { status: 400 });
    }

    if (action === "poll") {
      const connection = await getOrReconnectPty(
        session.sandboxId,
        ptyKey,
        ptyId,
      );
      if (connection) {
        return NextResponse.json({
          connected: true,
          output: connection.getOutput(),
        });
      }
      return NextResponse.json({ connected: false, output: "" });
    }

    let connection = activePtyHandles.get(ptyKey);
    if (!connection || !connection.isConnected()) {
      const sandbox = await getSandbox(session.sandboxId);

      try {
        connection = await createPtyConnection(
          sandbox,
          ptyId,
          cols || 120,
          rows || 30,
        );
        activePtyHandles.set(ptyKey, connection);
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : String(e);
        if (errMsg.includes("already exists")) {
          await sandbox.process.killPtySession(ptyId);
          connection = await createPtyConnection(
            sandbox,
            ptyId,
            cols || 120,
            rows || 30,
          );
          activePtyHandles.set(ptyKey, connection);
        } else {
          throw e;
        }
      }

      if (!session.ptySessionId) {
        await convex.mutation(api.sessions.updatePtySession, {
          id: sessionId as Id<"sessions">,
          ptySessionId: ptyId,
        });
      }
    }

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
      { status: 500 },
    );
  }
}
