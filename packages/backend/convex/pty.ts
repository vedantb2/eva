"use node";

import type { Sandbox } from "@daytonaio/sdk";
import { v } from "convex/values";
import { action } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { resolveDaytonaApiKey } from "./envVarResolver";
import {
  getDaytona,
  LEGACY_WORKSPACE_DIR,
  WORKSPACE_DIR,
} from "./_daytona/helpers";

const DAYTONA_API_URL = "https://app.daytona.io/api";

const PTY_WORKSPACE_CANDIDATES = [WORKSPACE_DIR, LEGACY_WORKSPACE_DIR];

/**
 * Discriminated owner — a PTY belongs to either a session or a quick task.
 * Both expose a sandbox and a repo; sessions additionally track a default
 * `ptySessionId` for the legacy single-terminal flow.
 */
const ownerArg = v.union(
  v.object({
    kind: v.literal("session"),
    sessionId: v.id("sessions"),
  }),
  v.object({
    kind: v.literal("task"),
    taskId: v.id("agentTasks"),
  }),
);

interface ResolvedOwner {
  sandboxId: string;
  repoId: Id<"githubRepos">;
  /** Legacy default-terminal pointer; only sessions track this. */
  defaultPtyId: string | undefined;
  /** Bound mutator for the default-terminal pointer; tasks have no equivalent. */
  setDefaultPtyId: ((nextPtyId: string) => Promise<void>) | undefined;
  /** Stable suffix used to derive the legacy default PTY name when missing. */
  ownerIdSuffix: string;
}

async function resolveOwner(
  ctx: ActionCtx,
  owner:
    | { kind: "session"; sessionId: Id<"sessions"> }
    | { kind: "task"; taskId: Id<"agentTasks"> },
): Promise<ResolvedOwner> {
  if (owner.kind === "session") {
    const session = await ctx.runQuery(internal.sessions.getInternal, {
      id: owner.sessionId,
    });
    if (!session) throw new Error("Session not found");
    if (!session.sandboxId) throw new Error("Sandbox not active");
    return {
      sandboxId: session.sandboxId,
      repoId: session.repoId,
      defaultPtyId: session.ptySessionId || undefined,
      setDefaultPtyId: async (nextPtyId: string) => {
        await ctx.runMutation(internal.sessions.updatePtySessionInternal, {
          id: owner.sessionId,
          ptySessionId: nextPtyId,
        });
      },
      ownerIdSuffix: String(owner.sessionId).slice(-8),
    };
  }

  const task = await ctx.runQuery(internal.agentTasks.getInternal, {
    id: owner.taskId,
  });
  if (!task) throw new Error("Task not found");
  if (!task.sandboxId) throw new Error("Sandbox not active");
  if (!task.repoId) throw new Error("Task has no repo");
  return {
    sandboxId: task.sandboxId,
    repoId: task.repoId,
    defaultPtyId: undefined,
    setDefaultPtyId: undefined,
    ownerIdSuffix: String(owner.taskId).slice(-8),
  };
}

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

/** Connects to or creates a PTY for a session or task, returning the WebSocket URL. */
export const connectPty = action({
  args: {
    owner: ownerArg,
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

    const resolved = await resolveOwner(ctx, args.owner);
    const { daytonaApiKey } = await resolveDaytonaApiKey(ctx, resolved.repoId);
    const daytona = getDaytona(daytonaApiKey);
    const sandbox = await daytona.get(resolved.sandboxId);

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
      // Legacy default-terminal flow — only sessions take this branch in
      // practice; tasks always pass an explicit ptyInstanceId from the
      // multi-pane UI.
      ptyId = resolved.defaultPtyId || `pty-${resolved.ownerIdSuffix}`;
      isNewPty = false;

      if (resolved.defaultPtyId) {
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
        if (resolved.setDefaultPtyId) {
          await resolved.setDefaultPtyId(ptyId);
        }
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
    owner: ownerArg,
    cols: v.number(),
    rows: v.number(),
    ptyInstanceId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const resolved = await resolveOwner(ctx, args.owner);

    const explicitId =
      args.ptyInstanceId !== undefined && args.ptyInstanceId.length > 0
        ? args.ptyInstanceId
        : null;
    const ptyId = explicitId
      ? explicitId
      : resolved.defaultPtyId || `pty-${resolved.ownerIdSuffix}`;

    const { daytonaApiKey } = await resolveDaytonaApiKey(ctx, resolved.repoId);
    const daytona = getDaytona(daytonaApiKey);
    const sandbox = await daytona.get(resolved.sandboxId);
    try {
      await sandbox.process.resizePtySession(ptyId, args.cols, args.rows);
    } catch (error) {
      // PTY session may not exist yet (startup) or may have disconnected
      // Log warning but don't throw - resize is best-effort
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("not found")) {
        console.warn(
          `[pty] resizePty: PTY session ${ptyId} not found, ignoring`,
        );
      } else {
        throw error;
      }
    }

    return null;
  },
});

/** Kills the PTY session for a sandbox and clears the stored PTY session ID. */
export const disconnectPty = action({
  args: {
    owner: ownerArg,
    ptyInstanceId: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const resolved = await resolveOwner(ctx, args.owner);

    const explicitId =
      args.ptyInstanceId !== undefined && args.ptyInstanceId.length > 0
        ? args.ptyInstanceId
        : null;

    const ptyId = explicitId
      ? explicitId
      : resolved.defaultPtyId || `pty-${resolved.ownerIdSuffix}`;

    const { daytonaApiKey } = await resolveDaytonaApiKey(ctx, resolved.repoId);
    const daytona = getDaytona(daytonaApiKey);
    const sandbox = await daytona.get(resolved.sandboxId);
    try {
      await sandbox.process.killPtySession(ptyId);
    } catch {
      // PTY may already be dead
    }

    if (!explicitId && resolved.setDefaultPtyId) {
      await resolved.setDefaultPtyId("");
    }

    return null;
  },
});
