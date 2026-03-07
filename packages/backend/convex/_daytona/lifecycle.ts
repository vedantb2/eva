"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { exec, resolveSandboxContext, getSandbox } from "./helpers";
import { createSandbox } from "./git";

export const warmSnapshotCache = internalAction({
  args: { repoId: v.id("githubRepos") },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const { daytona, sandboxEnvVars, snapshotName } =
        await resolveSandboxContext(ctx, args.repoId);
      if (!snapshotName) return null;
      const repo = await ctx.runQuery(internal.repoSnapshots.getRepo, {
        repoId: args.repoId,
      });
      if (!repo) return null;
      const sandbox = await createSandbox(
        daytona,
        repo.installationId,
        sandboxEnvVars,
        snapshotName,
      );
      await sandbox.delete();
      console.log(
        `[daytona] Warmed snapshot cache for ${repo.owner}/${repo.name}`,
      );
    } catch (err) {
      console.error(
        "[daytona] warmSnapshotCache failed (best-effort):",
        err instanceof Error ? err.message : err,
      );
    }
    return null;
  },
});

export const killSandboxProcess = internalAction({
  args: {
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);
      await exec(
        sandbox,
        "pkill -f 'claude-code' 2>/dev/null; pkill -f 'run-design.mjs' 2>/dev/null; true",
        10,
      );
    } catch {
      // Sandbox may already be stopped/deleted
    }
    return null;
  },
});

export const deleteSandbox = internalAction({
  args: { sandboxId: v.string(), repoId: v.id("githubRepos") },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);
      await sandbox.delete();
    } catch {
      // Sandbox may already be deleted or expired
    }
    return null;
  },
});
