"use node";

import type { Sandbox } from "@daytonaio/sdk";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { resolveDaytonaApiKey } from "./envVarResolver";
import {
  getDaytona,
  LEGACY_WORKSPACE_DIR,
  WORKSPACE_DIR,
} from "./_daytona/helpers";

const DAYTONA_API_URL = "https://app.daytona.io/api";

const PTY_WORKSPACE_CANDIDATES = [WORKSPACE_DIR, LEGACY_WORKSPACE_DIR];

/** Creates a PTY session in the sandbox, trying workspace directory candidates in order. */
async function createPtyInWorkspace(
  sandbox: Sandbox,
  ptyId: string,
  cols: number,
  rows: number,
) {
  for (const cwd of PTY_WORKSPACE_CANDIDATES) {
    try {
      return await sandbox.process.createPty({
        id: ptyId,
        cols,
        rows,
        cwd,
        envs: { TERM: "xterm-256color" },
        onData: () => {},
      });
    } catch (error) {
      if (cwd === LEGACY_WORKSPACE_DIR) {
        throw error;
      }
    }
  }
  throw new Error("Failed to create PTY");
}

async function ensurePtySessionReady(
  sandbox: Sandbox,
  ptyId: string,
  cols: number,
  rows: number,
): Promise<{ isNewPty: boolean }> {
  try {
    await sandbox.process.resizePtySession(ptyId, cols, rows);
    return { isNewPty: false };
  } catch {
    try {
      const handle = await createPtyInWorkspace(sandbox, ptyId, cols, rows);
      await handle.disconnect();
      return { isNewPty: true };
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      if (errMsg.includes("already exists")) {
        await sandbox.process.resizePtySession(ptyId, cols, rows);
        return { isNewPty: false };
      }
      throw e;
    }
  }
}

/** Fetches the toolbox proxy base URL for a Daytona sandbox. */
async function getToolboxBaseUrl(
  sandboxId: string,
  apiKey: string,
): Promise<string> {
  const response = await fetch(
    `${DAYTONA_API_URL}/sandbox/${sandboxId}/toolbox-proxy-url`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    },
  );
  if (!response.ok) {
    throw new Error(`Failed to get toolbox URL: ${response.status}`);
  }
  const data: { url: string } = await response.json();
  return data.url;
}

/** Connects to or creates a PTY for a session, returning the WebSocket URL. */
export const connectPty = action({
  args: {
    sessionId: v.id("sessions"),
    cols: v.number(),
    rows: v.number(),
    ptyInstanceId: v.optional(v.string()),
  },
  returns: v.object({
    wsUrl: v.string(),
    ptySessionId: v.string(),
    isNewPty: v.boolean(),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{ wsUrl: string; ptySessionId: string; isNewPty: boolean }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const session = await ctx.runQuery(internal.sessions.getInternal, {
      id: args.sessionId,
    });
    if (!session) throw new Error("Session not found");
    if (!session.sandboxId) throw new Error("Sandbox not active");

    const { daytonaApiKey } = await resolveDaytonaApiKey(ctx, session.repoId);
    const daytona = getDaytona(daytonaApiKey);
    const sandbox = await daytona.get(session.sandboxId);

    const explicitId =
      args.ptyInstanceId !== undefined && args.ptyInstanceId.length > 0
        ? args.ptyInstanceId
        : null;

    let ptyId: string;
    let isNewPty: boolean;

    if (explicitId) {
      const result = await ensurePtySessionReady(
        sandbox,
        explicitId,
        args.cols,
        args.rows,
      );
      ptyId = explicitId;
      isNewPty = result.isNewPty;
    } else {
      ptyId = session.ptySessionId || `pty-${String(args.sessionId).slice(-8)}`;
      isNewPty = false;

      if (session.ptySessionId) {
        try {
          await sandbox.process.resizePtySession(ptyId, args.cols, args.rows);
        } catch {
          const handle = await createPtyInWorkspace(
            sandbox,
            ptyId,
            args.cols,
            args.rows,
          );
          await handle.disconnect();
          isNewPty = true;
        }
      } else {
        try {
          const handle = await createPtyInWorkspace(
            sandbox,
            ptyId,
            args.cols,
            args.rows,
          );
          await handle.disconnect();
        } catch (e) {
          const errMsg = e instanceof Error ? e.message : String(e);
          if (errMsg.includes("already exists")) {
            await sandbox.process.resizePtySession(ptyId, args.cols, args.rows);
          } else {
            throw e;
          }
        }
        await ctx.runMutation(internal.sessions.updatePtySessionInternal, {
          id: args.sessionId,
          ptySessionId: ptyId,
        });
        isNewPty = true;
      }
    }

    const [toolboxUrl, previewLink] = await Promise.all([
      getToolboxBaseUrl(sandbox.id, daytonaApiKey),
      sandbox.getPreviewLink(1),
    ]);
    const toolboxUrlObj = new URL(toolboxUrl);
    toolboxUrlObj.protocol = "https:";
    let baseUrl = toolboxUrlObj.toString();
    if (!baseUrl.endsWith("/")) baseUrl += "/";
    baseUrl += sandbox.id;
    const wsUrl = `${baseUrl.replace(/^https/, "wss")}/process/pty/${ptyId}/connect?DAYTONA_SANDBOX_AUTH_KEY=${previewLink.token}`;

    return { wsUrl, ptySessionId: ptyId, isNewPty };
  },
});

/** Resizes an existing PTY session to the given column and row dimensions. */
export const resizePty = action({
  args: {
    sessionId: v.id("sessions"),
    cols: v.number(),
    rows: v.number(),
    ptyInstanceId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const session = await ctx.runQuery(internal.sessions.getInternal, {
      id: args.sessionId,
    });
    if (!session) throw new Error("Session not found");
    if (!session.sandboxId) throw new Error("Sandbox not active");

    const explicitId =
      args.ptyInstanceId !== undefined && args.ptyInstanceId.length > 0
        ? args.ptyInstanceId
        : null;
    const ptyId = explicitId
      ? explicitId
      : session.ptySessionId || `pty-${String(args.sessionId).slice(-8)}`;

    const { daytonaApiKey } = await resolveDaytonaApiKey(ctx, session.repoId);
    const daytona = getDaytona(daytonaApiKey);
    const sandbox = await daytona.get(session.sandboxId);
    await sandbox.process.resizePtySession(ptyId, args.cols, args.rows);

    return null;
  },
});

/** Kills the PTY session for a sandbox and clears the stored PTY session ID. */
export const disconnectPty = action({
  args: {
    sessionId: v.id("sessions"),
    ptyInstanceId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const session = await ctx.runQuery(internal.sessions.getInternal, {
      id: args.sessionId,
    });
    if (!session) throw new Error("Session not found");
    if (!session.sandboxId) throw new Error("Sandbox not active");

    const explicitId =
      args.ptyInstanceId !== undefined && args.ptyInstanceId.length > 0
        ? args.ptyInstanceId
        : null;

    const ptyId = explicitId
      ? explicitId
      : session.ptySessionId || `pty-${String(args.sessionId).slice(-8)}`;

    const { daytonaApiKey } = await resolveDaytonaApiKey(ctx, session.repoId);
    const daytona = getDaytona(daytonaApiKey);
    const sandbox = await daytona.get(session.sandboxId);
    try {
      await sandbox.process.killPtySession(ptyId);
    } catch {
      // PTY may already be dead
    }

    if (!explicitId) {
      await ctx.runMutation(internal.sessions.updatePtySessionInternal, {
        id: args.sessionId,
        ptySessionId: "",
      });
    }

    return null;
  },
});
