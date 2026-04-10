"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { exec, getSandbox, workspaceDirShell } from "./helpers";
import { setDisplayResolution, launchChrome } from "./desktop";

export const toggleCodeServer = action({
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
      await exec(
        sandbox,
        `pgrep -f 'code-server.*8080' > /dev/null 2>&1 || code-server --port 8080 --auth none --bind-addr 0.0.0.0 ${workspaceDirShell()} > /tmp/code-server.log 2>&1 &`,
        10,
      );
    } else {
      await exec(sandbox, "pkill -f code-server || true", 10);
    }

    return null;
  },
});

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
      await sandbox.computerUse.start();
      await setDisplayResolution(sandbox);
    } else {
      await sandbox.computerUse.stop();
    }

    return null;
  },
});

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
