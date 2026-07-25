"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import {
  getSandboxHandle,
  execHandle,
  KILL_PRIOR_AGENT_PROCESSES_CMD,
  signAndLaunchScript,
} from "./helpers";
import { getTaskRunStreamingEntityId } from "../_taskWorkflow/helpers";

/**
 * Proof can still need Convex boot + app ready + browser walkthrough.
 * Stall timeouts stay tighter than coding; wall-clock allows a full capture
 * (the old 10m cap was killing Cursor proof turns before any media landed).
 */
const PROOF_TIMEOUT_ENV_VARS = {
  CLAUDE_FIRST_EVENT_TIMEOUT_MS: "60000",
  CLAUDE_POST_TEXT_STALL_TIMEOUT_MS: "180000",
  CLAUDE_NO_OUTPUT_TIMEOUT_MS: "180000",
  CLAUDE_MAX_TOTAL_RUNTIME_MS: "1800000",
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Before proof capture: revive dead background daemons (e.g. `npx convex dev`
 * so new functions from the coding turn are deployed) and start the app
 * server so agent-browser does not screenshot Convex/runtime error pages.
 */
export const prepareProofSandbox = internalAction({
  args: {
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
    taskId: v.id("agentTasks"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const bg = await ctx.runAction(internal.sandbox.runBackgroundCommands, {
      sandboxId: args.sandboxId,
      repoId: args.repoId,
      onlyRestartDead: true,
    });
    if (bg.commandCount > 0) {
      // Fresh Convex needs time to start local backend + push functions.
      console.log(
        `[daytona] prepareProofSandbox: restarted ${bg.commandCount} background command(s); waiting for deploy`,
      );
      await sleep(20_000);
    } else {
      // Already running — still give watchers a beat to pick up new functions
      // committed during the coding turn.
      await sleep(5_000);
    }

    try {
      await ctx.runAction(internal.sandbox.runDevServerInTaskSandbox, {
        taskId: args.taskId,
        sandboxId: args.sandboxId,
        repoId: args.repoId,
      });
      await sleep(8_000);
    } catch (error) {
      console.error(
        `[daytona] prepareProofSandbox: dev server start failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return null;
  },
});

/**
 * Polls briefly for media after proof completion. Covers residual races where
 * the capture callback finished the completion mutation slightly before
 * `taskProof:save` committed (legacy order); with media-before-completion this
 * usually returns on the first check.
 */
export const waitForProofMedia = internalAction({
  args: {
    taskId: v.id("agentTasks"),
    runId: v.id("agentRuns"),
    timeoutMs: v.optional(v.number()),
  },
  returns: v.boolean(),
  handler: async (ctx, args): Promise<boolean> => {
    const timeoutMs = args.timeoutMs ?? 20_000;
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const hasMedia: boolean = await ctx.runQuery(
        internal.taskProof.hasMediaForRun,
        {
          taskId: args.taskId,
          runId: args.runId,
        },
      );
      if (hasMedia) return true;
      await sleep(2_000);
    }
    const finalHasMedia: boolean = await ctx.runQuery(
      internal.taskProof.hasMediaForRun,
      {
        taskId: args.taskId,
        runId: args.runId,
      },
    );
    return finalHasMedia;
  },
});

/**
 * Launches a proof-capture agent on an existing task sandbox after implementation.
 * Uses repo.proofModel (falls back to the task model / sonnet). Does not require
 * a new git commit — implementation already committed and pushed.
 *
 * Streams on the same entity as the implementation run so the run watchdog keeps
 * seeing heartbeats during the proof phase (proof runs before finalize).
 */
export const launchProof = internalAction({
  args: {
    sandboxId: v.string(),
    prompt: v.string(),
    taskId: v.string(),
    runId: v.id("agentRuns"),
    userId: v.id("users"),
    repoId: v.id("githubRepos"),
    model: v.optional(v.string()),
    rootDirectory: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const sandbox = await getSandboxHandle(ctx, args.repoId, args.sandboxId);
    const repo = await ctx.runQuery(internal.githubRepos.getInternal, {
      id: args.repoId,
    });

    await execHandle(sandbox, KILL_PRIOR_AGENT_PROCESSES_CMD, 10);

    const model = args.model ?? repo?.proofModel ?? "sonnet";
    const rootDirectory = args.rootDirectory ?? repo?.rootDirectory ?? "";

    await signAndLaunchScript(
      ctx,
      sandbox,
      args.userId,
      args.prompt,
      "taskWorkflow:handleProofCompletion",
      "taskId",
      args.taskId,
      args.repoId,
      {
        model,
        allowedTools: "Read,Bash,Glob,Grep,Skill",
        extraEnvVars: {
          STREAMING_ENTITY_ID: getTaskRunStreamingEntityId(args.runId),
          RUN_ID: String(args.runId),
          TASK_PROOF_CAPTURE_ENABLED: "true",
          ROOT_DIRECTORY: rootDirectory,
          ...PROOF_TIMEOUT_ENV_VARS,
        },
        enableMcp: false,
      },
    );

    return null;
  },
});
