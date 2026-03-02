"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { Daytona } from "@daytonaio/sdk";
import { resolveDaytonaApiKey } from "./envVarResolver";

const WORKSPACE_DIR = "/workspace/repo";
const DAYTONA_API_URL = "https://app.daytona.io/api";

function getDaytona(apiKey: string): Daytona {
  return new Daytona({ apiKey });
}

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

export const connectPty = action({
  args: {
    sessionId: v.id("sessions"),
    cols: v.number(),
    rows: v.number(),
  },
  returns: v.object({
    wsUrl: v.string(),
    ptySessionId: v.string(),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{ wsUrl: string; ptySessionId: string }> => {
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

    let ptyId: string | undefined = session.ptySessionId;

    if (!ptyId) {
      ptyId = `pty-${String(args.sessionId).slice(-8)}`;
      try {
        const handle = await sandbox.process.createPty({
          id: ptyId,
          cols: args.cols,
          rows: args.rows,
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
            cols: args.cols,
            rows: args.rows,
            cwd: WORKSPACE_DIR,
            envs: { TERM: "xterm-256color" },
            onData: () => {},
          });
          await handle.disconnect();
        } else {
          throw e;
        }
      }

      await ctx.runMutation(internal.sessions.updatePtySessionInternal, {
        id: args.sessionId,
        ptySessionId: ptyId,
      });
    }

    const [toolboxUrl, previewLink] = await Promise.all([
      getToolboxBaseUrl(sandbox.id, daytonaApiKey),
      sandbox.getPreviewLink(1),
    ]);
    let baseUrl = toolboxUrl;
    if (!baseUrl.endsWith("/")) baseUrl += "/";
    baseUrl += sandbox.id;
    const wsUrl = `${baseUrl.replace(/^http/, "ws")}/process/pty/${ptyId}/connect?DAYTONA_SANDBOX_AUTH_KEY=${previewLink.token}`;

    return { wsUrl, ptySessionId: ptyId };
  },
});

export const resizePty = action({
  args: {
    sessionId: v.id("sessions"),
    cols: v.number(),
    rows: v.number(),
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

    const ptyId =
      session.ptySessionId || `pty-${String(args.sessionId).slice(-8)}`;

    const { daytonaApiKey } = await resolveDaytonaApiKey(ctx, session.repoId);
    const daytona = getDaytona(daytonaApiKey);
    const sandbox = await daytona.get(session.sandboxId);
    await sandbox.process.resizePtySession(ptyId, args.cols, args.rows);

    return null;
  },
});

export const disconnectPty = action({
  args: {
    sessionId: v.id("sessions"),
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

    const ptyId =
      session.ptySessionId || `pty-${String(args.sessionId).slice(-8)}`;

    const { daytonaApiKey } = await resolveDaytonaApiKey(ctx, session.repoId);
    const daytona = getDaytona(daytonaApiKey);
    const sandbox = await daytona.get(session.sandboxId);
    try {
      await sandbox.process.killPtySession(ptyId);
    } catch {
      // PTY may already be dead
    }

    await ctx.runMutation(internal.sessions.updatePtySessionInternal, {
      id: args.sessionId,
      ptySessionId: "",
    });

    return null;
  },
});
