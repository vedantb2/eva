"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import {
  exec,
  resolveSandboxContext,
  getSandbox,
  sleep,
  WARMING_SANDBOX_READY_TIMEOUT_SECONDS,
} from "./helpers";
import { createSandbox, WARMING_LIFECYCLE } from "./git";

const MAX_WARMUP_RETRIES = 2;
const WARMUP_RETRY_DELAY_MS = 5_000;

/** Warms the Daytona snapshot cache for a repo by creating and immediately deleting a sandbox, with retries. */
export const warmSnapshotCache = internalAction({
  args: {
    repoId: v.id("githubRepos"),
    buildId: v.id("snapshotBuilds"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { daytona, sandboxEnvVars, snapshotName } =
      await resolveSandboxContext(ctx, args.repoId);
    if (!snapshotName) return null;
    const repo = await ctx.runQuery(internal.repoSnapshots.getRepo, {
      repoId: args.repoId,
    });
    if (!repo) return null;

    let lastError = "";
    for (let attempt = 0; attempt <= MAX_WARMUP_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          console.log(
            `[daytona] Warmup retry ${attempt}/${MAX_WARMUP_RETRIES} for ${repo.owner}/${repo.name}`,
          );
          await sleep(WARMUP_RETRY_DELAY_MS);
        }
        const sandbox = await createSandbox(
          daytona,
          repo.installationId,
          sandboxEnvVars,
          WARMING_LIFECYCLE,
          snapshotName,
          undefined,
          WARMING_SANDBOX_READY_TIMEOUT_SECONDS,
        );
        await sandbox.delete();
        console.log(
          `[daytona] Warmed snapshot cache for ${repo.owner}/${repo.name}`,
        );
        await ctx.runMutation(internal.repoSnapshots.updateWarmupStatus, {
          buildId: args.buildId,
          status: "success",
        });
        return null;
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        console.error(
          `[daytona] warmSnapshotCache attempt ${attempt + 1} failed:`,
          lastError,
        );
      }
    }

    await ctx.runMutation(internal.repoSnapshots.updateWarmupStatus, {
      buildId: args.buildId,
      status: "error",
      error: lastError,
    });
    return null;
  },
});

/** Kills running CLI processes (claude-code, codex, run-design) inside a sandbox. */
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
        "pkill -f 'claude-code' 2>/dev/null; pkill -f 'codex' 2>/dev/null; pkill -f 'run-design.mjs' 2>/dev/null; true",
        10,
      );
    } catch {
      // Sandbox may already be stopped/deleted
    }
    return null;
  },
});

/** Stops a Daytona sandbox (preserves state, fast resume). Silently ignores already-stopped sandboxes. */
export const stopSandbox = internalAction({
  args: { sandboxId: v.string(), repoId: v.id("githubRepos") },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);
      await sandbox.stop();
    } catch {
      // Sandbox may already be stopped, archived, or deleted
    }
    return null;
  },
});

/** Deletes a Daytona sandbox, silently ignoring already-deleted sandboxes. */
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
