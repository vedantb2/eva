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

/** Shorter timeouts than implementation — proof is browser capture only. */
const PROOF_TIMEOUT_ENV_VARS = {
  CLAUDE_FIRST_EVENT_TIMEOUT_MS: "30000",
  CLAUDE_POST_TEXT_STALL_TIMEOUT_MS: "120000",
  CLAUDE_NO_OUTPUT_TIMEOUT_MS: "120000",
  CLAUDE_MAX_TOTAL_RUNTIME_MS: "600000",
};

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
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const sandbox = await getSandboxHandle(ctx, args.repoId, args.sandboxId);
    const repo = await ctx.runQuery(internal.githubRepos.getInternal, {
      id: args.repoId,
    });

    await execHandle(sandbox, KILL_PRIOR_AGENT_PROCESSES_CMD, 10);

    const model = args.model ?? repo?.proofModel ?? "sonnet";

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
          ...PROOF_TIMEOUT_ENV_VARS,
        },
        enableMcp: false,
      },
    );

    return null;
  },
});
