"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { resolveDaytonaApiKey } from "./envVarResolver";
import { getDaytona } from "./_daytona/helpers";
import { ownerArg, resolveOwner } from "./_pty/owners";
import {
  createPtyInWorkspace,
  ensurePtySessionReady,
  getToolboxBaseUrl,
} from "./_pty/daytona";

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
