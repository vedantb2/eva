"use node";

import { v } from "convex/values";
import { quote } from "shell-quote";
import { action, internalAction } from "../_generated/server";
import { api, internal } from "../_generated/api";
import { resolveSandboxCredentials } from "../envVarResolver";
import { execHandle, getSandboxHandle, workspaceDirShell } from "./helpers";
import { launchChrome, startDesktopWithChrome } from "./desktop";
import { VERCEL_EDITOR_INTERNAL_PORT } from "./previewProxy";

/** Starts or stops a code-server instance inside a sandbox. */
export const toggleCodeServer = action({
  args: {
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
    action: v.union(v.literal("start"), v.literal("stop")),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    logs: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    console.log(
      `[code-server] ${args.action} requested for sandbox ${args.sandboxId}`,
    );
    const handle = await getSandboxHandle(ctx, args.repoId, args.sandboxId);
    // Validates that the repo has Vercel sandbox credentials configured;
    // throws before touching the sandbox if it does not.
    await resolveSandboxCredentials(ctx, args.repoId);
    // Listen internally so the auth proxy can own the exposed port.
    const listenPort = VERCEL_EDITOR_INTERNAL_PORT;
    const bindAddr = "127.0.0.1";

    if (args.action === "start") {
      try {
        const checkResult = await execHandle(
          handle,
          `curl -fsS http://127.0.0.1:${listenPort}/ >/dev/null 2>&1 && echo running || true`,
          5,
        );
        if (checkResult.trim().includes("running")) {
          return {
            success: true,
            message: `Already running on ${listenPort}`,
          };
        }
      } catch {
        // Not running, proceed to start
      }

      console.log(
        `[code-server] Starting code-server on port ${listenPort}...`,
      );
      try {
        // Native detached exec — `… &` inside sync runCommand zombies on Vercel.
        await handle.execDetached(
          `code-server --port ${listenPort} --auth none --bind-addr ${bindAddr} ${workspaceDirShell()} > /tmp/code-server.log 2>&1`,
        );

        await new Promise((resolve) => setTimeout(resolve, 2000));

        const ready = await execHandle(
          handle,
          `for i in $(seq 1 20); do curl -fsS http://127.0.0.1:${listenPort}/ >/dev/null 2>&1 && echo ready && exit 0; sleep 0.5; done; echo not_ready`,
          20,
        );
        const logs = await execHandle(
          handle,
          "tail -20 /tmp/code-server.log 2>/dev/null || echo 'No logs yet'",
          5,
        );

        if (ready.trim().includes("ready")) {
          console.log(`[code-server] Started successfully on ${listenPort}`);
          return {
            success: true,
            message: `Started on ${listenPort}`,
            logs,
          };
        }
        console.error(`[code-server] Failed to start. Logs:\n${logs}`);
        return { success: false, message: "Failed to start", logs };
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`[code-server] Error starting: ${errorMsg}`);
        let logs = "";
        try {
          logs = await execHandle(
            handle,
            "tail -20 /tmp/code-server.log 2>/dev/null || echo 'No logs'",
            5,
          );
        } catch {
          logs = "Could not retrieve logs";
        }
        return { success: false, message: errorMsg, logs };
      }
    } else {
      console.log(`[code-server] Stopping code-server...`);
      try {
        await execHandle(handle, "pkill -f code-server || true", 10);
        console.log(`[code-server] Stopped`);
        return { success: true, message: "Stopped" };
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`[code-server] Error stopping: ${errorMsg}`);
        return { success: false, message: errorMsg };
      }
    }
  },
});

/** Starts or stops the desktop (computer-use) server inside a sandbox. */
export const toggleDesktopServer = action({
  args: {
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
    action: v.union(v.literal("start"), v.literal("stop")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const handle = await getSandboxHandle(ctx, args.repoId, args.sandboxId);
    if (!handle.desktop) {
      throw new Error("Desktop is not available for this sandbox provider");
    }

    if (args.action === "start") {
      // Resolution comes from the VNC_RESOLUTION env var set at sandbox creation
      // (see createSandbox in git.ts) — Xvfb starts at 1920x1080 natively.
      await handle.desktop.start();
    } else {
      await handle.desktop.stop();
    }

    return null;
  },
});

/** Launches Chrome inside the sandbox desktop environment. */
export const launchChromeInDesktop = action({
  args: {
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const handle = await getSandboxHandle(ctx, args.repoId, args.sandboxId);
    await launchChrome(handle);

    return null;
  },
});

/**
 * On-demand desktop + Chrome for the shared browser MCP tools. Idempotent —
 * safe to call when VNC/Chrome are already up. Resolves the session/task/
 * project from the MCP token claim (entityKind + entityId).
 */
export const startDesktopForBrowserEntity = internalAction({
  args: {
    entityKind: v.union(
      v.literal("session"),
      v.literal("task"),
      v.literal("project"),
    ),
    entityId: v.string(),
    clerkUserId: v.string(),
  },
  returns: v.object({
    ok: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const entity =
      args.entityKind === "session"
        ? await ctx.runQuery(internal.sessions.getInternal, {
            id: args.entityId,
          })
        : args.entityKind === "task"
          ? await ctx.runQuery(internal.agentTasks.getInternalByStringId, {
              id: args.entityId,
            })
          : await ctx.runQuery(internal.projects.getInternalByStringId, {
              id: args.entityId,
            });
    if (!entity) {
      return { ok: false, message: `${args.entityKind} not found.` };
    }
    if (!entity.repoId) {
      return {
        ok: false,
        message: `No repo on this ${args.entityKind}.`,
      };
    }

    const user = await ctx.runQuery(internal.mcp.queries.getUserByClerkId, {
      clerkUserId: args.clerkUserId,
    });
    if (!user) {
      return { ok: false, message: "User not found." };
    }

    const hasAccess = await ctx.runQuery(
      internal.mcp.queries.checkRepoAccessForUser,
      { repoId: entity.repoId, userId: user._id },
    );
    if (!hasAccess) {
      return {
        ok: false,
        message: `Access denied for this ${args.entityKind}'s repo.`,
      };
    }

    const sandboxId = entity.sandboxId;
    if (!sandboxId) {
      return {
        ok: false,
        message: `No sandbox on this ${args.entityKind}. Start the sandbox before using the shared browser.`,
      };
    }

    try {
      const handle = await getSandboxHandle(ctx, entity.repoId, sandboxId);
      await startDesktopWithChrome(handle);
      return {
        ok: true,
        message:
          "Chrome ready. Run `agent-browser connect 9222`. User watches in Browser tab. App: http://localhost:3000",
      };
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to start shared desktop Chrome.",
      };
    }
  },
});

/** Cap on how many bytes the File Viewer will read from a single file. */
const MAX_FILE_VIEWER_BYTES = 512 * 1024;
const NOT_FOUND_MARKER = "__EVA_NOT_FOUND__";

/**
 * Reads a single file's contents out of a running sandbox for the chat File
 * Viewer. Uses a shell `head -c` so the read is size-capped in the sandbox
 * rather than streaming an arbitrarily large file back.
 *
 * Never resumes a stopped sandbox: on Vercel any exec on a stopped VM revives
 * it (see getPreviewUrl in execution.ts), so we check `handle.state` — which is
 * fresh, since getSandboxHandle fetches with resume:false — before touching it.
 */
export const readSandboxFile = action({
  args: {
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
    path: v.string(),
  },
  returns: v.union(
    v.object({
      status: v.literal("ok"),
      content: v.string(),
      truncated: v.boolean(),
    }),
    v.object({ status: v.literal("not_running") }),
    v.object({ status: v.literal("not_found") }),
    v.object({ status: v.literal("binary") }),
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Authorize against the sandbox's repo, same as getPreviewUrl: a null repo
    // means the caller is neither the connector nor a team member.
    const repo = await ctx.runQuery(api.githubRepos.get, { id: args.repoId });
    if (!repo) throw new Error("Not authorized to access this repository");

    const handle = await getSandboxHandle(ctx, args.repoId, args.sandboxId);
    if (handle.state !== "running") {
      return { status: "not_running" as const };
    }

    // `p` is single-quoted by shell-quote, so an arbitrary path cannot inject.
    // Output: first line is the byte count (or the not-found marker), and the
    // file bytes follow the first newline. The script always exits 0 so
    // execHandle does not throw for a missing file.
    const p = quote([args.path]);
    const script =
      `p=${p}; ` +
      `if [ ! -f "$p" ]; then echo ${NOT_FOUND_MARKER}; ` +
      `else wc -c < "$p" | tr -d ' '; head -c ${MAX_FILE_VIEWER_BYTES} "$p"; fi`;
    const out = await execHandle(handle, script, 30);

    const newlineIndex = out.indexOf("\n");
    const firstLine = (
      newlineIndex === -1 ? out : out.slice(0, newlineIndex)
    ).trim();
    if (firstLine === NOT_FOUND_MARKER) {
      return { status: "not_found" as const };
    }

    const content = newlineIndex === -1 ? "" : out.slice(newlineIndex + 1);
    if (content.includes(String.fromCharCode(0))) {
      return { status: "binary" as const };
    }

    const size = Number.parseInt(firstLine, 10);
    const truncated = Number.isFinite(size) && size > MAX_FILE_VIEWER_BYTES;
    return { status: "ok" as const, content, truncated };
  },
});

/** Cap on entries returned to the Files tab tree. */
const MAX_FILE_LIST_ENTRIES = 20_000;

/**
 * Lists tracked + untracked (non-ignored) files in a running sandbox for the
 * session Files tab tree. Uses `git ls-files -z` so non-ASCII paths stay
 * unambiguous; NUL survives the exec transport (see binary detection above).
 *
 * The script embeds only a numeric cap — no user input — so shell-quote is
 * unnecessary. Cap is applied in-sandbox via GNU `head -z` so pathological
 * repos do not ship megabytes into the action.
 */
export const listSandboxFiles = action({
  args: {
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
  },
  returns: v.union(
    v.object({
      status: v.literal("ok"),
      root: v.string(),
      paths: v.array(v.string()),
      truncated: v.boolean(),
    }),
    v.object({ status: v.literal("not_running") }),
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const repo = await ctx.runQuery(api.githubRepos.get, { id: args.repoId });
    if (!repo) throw new Error("Not authorized to access this repository");

    const handle = await getSandboxHandle(ctx, args.repoId, args.sandboxId);
    if (handle.state !== "running") {
      return { status: "not_running" as const };
    }

    // Echo the resolved workspace root first so legacy `/workspace/repo`
    // sandboxes build correct absolute `?file=` paths. Keep default exec cwd.
    const script =
      `d=${workspaceDirShell()}; ` +
      `printf '%s\\0' "$d"; ` +
      `git -C "$d" ls-files --cached --others --exclude-standard -z` +
      ` | head -z -n ${MAX_FILE_LIST_ENTRIES + 1}`;
    const out = await execHandle(handle, script, 30);

    const records = out.split("\u0000");
    const root = records[0];
    if (!root) {
      throw new Error("Sandbox file list did not return a workspace root");
    }
    const entries = records.slice(1).filter((p) => p.trim().length > 0);
    const truncated = entries.length > MAX_FILE_LIST_ENTRIES;
    const paths = truncated ? entries.slice(0, MAX_FILE_LIST_ENTRIES) : entries;
    return { status: "ok" as const, root, paths, truncated };
  },
});
