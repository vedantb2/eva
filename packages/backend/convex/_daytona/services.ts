"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { exec, getSandbox, workspaceDirShell } from "./helpers";
import { launchChrome } from "./desktop";

/** Starts or stops a code-server instance inside a sandbox on port 8080. */
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
    const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);

    if (args.action === "start") {
      // Check if already running
      try {
        const checkResult = await exec(
          sandbox,
          "pgrep -f 'code-server.*8080'",
          5,
        );
        if (checkResult.trim()) {
          console.log(
            `[code-server] Already running (pid: ${checkResult.trim()})`,
          );
          return {
            success: true,
            message: `Already running (pid: ${checkResult.trim()})`,
          };
        }
      } catch {
        // Not running, proceed to start
      }

      // Start code-server
      console.log(`[code-server] Starting code-server on port 8080...`);
      try {
        await exec(
          sandbox,
          `code-server --port 8080 --auth none --bind-addr 0.0.0.0 ${workspaceDirShell()} > /tmp/code-server.log 2>&1 &`,
          10,
        );

        // Wait a moment and check if it started
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const pidCheck = await exec(
          sandbox,
          "pgrep -f 'code-server.*8080' || echo 'not running'",
          5,
        );
        const logs = await exec(
          sandbox,
          "tail -20 /tmp/code-server.log 2>/dev/null || echo 'No logs yet'",
          5,
        );

        if (pidCheck.trim() && pidCheck.trim() !== "not running") {
          console.log(
            `[code-server] Started successfully (pid: ${pidCheck.trim()})`,
          );
          console.log(`[code-server] Logs:\n${logs}`);
          return {
            success: true,
            message: `Started (pid: ${pidCheck.trim()})`,
            logs,
          };
        } else {
          console.error(`[code-server] Failed to start. Logs:\n${logs}`);
          return { success: false, message: "Failed to start", logs };
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`[code-server] Error starting: ${errorMsg}`);
        // Try to get logs anyway
        let logs = "";
        try {
          logs = await exec(
            sandbox,
            "tail -20 /tmp/code-server.log 2>/dev/null || echo 'No logs'",
            5,
          );
        } catch {
          logs = "Could not retrieve logs";
        }
        return { success: false, message: errorMsg, logs };
      }
    } else {
      // Stop code-server
      console.log(`[code-server] Stopping code-server...`);
      try {
        await exec(sandbox, "pkill -f code-server || true", 10);
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

    const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);

    if (args.action === "start") {
      // Resolution comes from the VNC_RESOLUTION env var set at sandbox creation
      // (see createSandbox in git.ts) — Xvfb starts at 1920x1080 natively.
      await sandbox.computerUse.start();
    } else {
      await sandbox.computerUse.stop();
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

    const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);
    await launchChrome(sandbox);

    return null;
  },
});
