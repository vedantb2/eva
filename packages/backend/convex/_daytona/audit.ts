"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import {
  exec,
  WORKSPACE_DIR,
  getSandbox,
  errorMessage,
  signAndLaunchScript,
} from "./helpers";
import { sessionClaudeUuid } from "./volumes";
import { getTaskAuditStreamingEntityId } from "../_taskWorkflow/helpers";

function buildSessionAuditPrompt(
  diff: string,
  categories: Array<{ name: string; description: string }>,
): string {
  const sectionDescriptions = categories
    .map((s, i) => `${i + 1}. **${s.name}**: ${s.description}`)
    .join("\n");

  const sectionJson = categories
    .map(
      (s) =>
        `    { "name": "${s.name}", "results": [{ "requirement": "...", "passed": true, "detail": "..." }] }`,
    )
    .join(",\n");

  return `You are a code auditor. Analyze this git diff and produce a JSON audit.

For each check, return { "requirement": "<check name>", "passed": true/false, "detail": "<1 sentence explanation>" }.

## Sections:
${sectionDescriptions}

Return ONLY valid JSON in this exact format:
{
  "sections": [
${sectionJson}
  ],
  "summary": "1-2 sentence overall assessment"
}

## Git Diff:
${diff.slice(0, 30000)}`;
}

export const launchAudit = internalAction({
  args: {
    sandboxId: v.string(),
    prompt: v.string(),
    taskId: v.string(),
    runId: v.id("agentRuns"),
    userId: v.id("users"),
    repoId: v.id("githubRepos"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);

    await signAndLaunchScript(
      ctx,
      sandbox,
      args.userId,
      args.prompt,
      "taskWorkflow:handleAuditCompletion",
      "taskId",
      args.taskId,
      {
        model: "haiku",
        extraEnvVars: {
          STREAMING_ENTITY_ID: getTaskAuditStreamingEntityId(args.runId),
          RUN_ID: String(args.runId),
        },
      },
    );

    return null;
  },
});

export const launchAuditFix = internalAction({
  args: {
    sandboxId: v.string(),
    prompt: v.string(),
    taskId: v.string(),
    runId: v.id("agentRuns"),
    userId: v.id("users"),
    repoId: v.id("githubRepos"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);

    await signAndLaunchScript(
      ctx,
      sandbox,
      args.userId,
      args.prompt,
      "taskWorkflow:handleAuditFixCompletion",
      "taskId",
      args.taskId,
      {
        model: "sonnet",
        allowedTools: "Read,Write,Edit,Bash,Glob,Grep",
        extraEnvVars: {
          STREAMING_ENTITY_ID: getTaskAuditStreamingEntityId(args.runId),
          RUN_ID: String(args.runId),
        },
      },
    );

    return null;
  },
});

export const runSessionAudit = internalAction({
  args: {
    sessionId: v.id("sessions"),
    sandboxId: v.string(),
    auditId: v.id("audits"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const session = await ctx.runQuery(internal.sessions.getInternal, {
        id: args.sessionId,
      });
      if (!session) {
        throw new Error("Session not found");
      }

      const sandbox = await getSandbox(ctx, session.repoId, args.sandboxId);

      const categories = await ctx.runQuery(
        internal.auditCategories.listEnabledByRepo,
        { repoId: session.repoId },
      );

      if (categories.length === 0) {
        await ctx.runMutation(internal.audits.fail, {
          id: args.auditId,
          error: "No audit categories enabled",
        });
        return null;
      }

      const diffRaw = await exec(
        sandbox,
        `cd ${WORKSPACE_DIR} && git diff HEAD~1..HEAD 2>/dev/null || echo ""`,
        30,
      );

      if (!diffRaw.trim()) {
        await ctx.runMutation(internal.audits.fail, {
          id: args.auditId,
          error: "No changes detected",
        });
        return null;
      }

      await signAndLaunchScript(
        ctx,
        sandbox,
        args.userId,
        buildSessionAuditPrompt(diffRaw, categories),
        "audits:handleSessionCompletion",
        "sessionId",
        String(args.sessionId),
        {
          model: "haiku",
          claudeSessionId: sessionClaudeUuid(args.sessionId),
        },
      );
    } catch (err) {
      await ctx.runMutation(internal.audits.fail, {
        id: args.auditId,
        error: errorMessage(err, "Audit failed"),
      });
    }
    return null;
  },
});
