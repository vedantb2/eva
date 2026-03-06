"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { exec, WORKSPACE_DIR, getSandbox, errorMessage } from "./helpers";
import { sessionClaudeUuid } from "./volumes";
import { launchScript } from "./launch";
import { getTaskAuditStreamingEntityId } from "../_taskWorkflow/helpers";

function buildSessionAuditPrompt(diff: string): string {
  return `You are a code auditor. Analyze this git diff and produce a JSON audit with 3 sections.

For each check, return { "requirement": "<check name>", "passed": true/false, "detail": "<1 sentence explanation>" }.

## Sections:
1. **accessibility**: WCAG checks (alt text, keyboard navigation, ARIA attributes, form labels, color contrast). If no frontend/UI code was changed, return a single item: { "requirement": "No UI changes", "passed": true, "detail": "No frontend code was modified" }.
2. **testing**: Whether tests were added or needed. If changes are trivial config/docs, return: { "requirement": "Changes trivial", "passed": true, "detail": "No tests needed for this change" }.
3. **codeReview**: Implementation quality — correctness, bugs, security, error handling, naming, code style.

Return ONLY valid JSON in this exact format:
{
  "accessibility": [{ "requirement": "...", "passed": true, "detail": "..." }],
  "testing": [{ "requirement": "...", "passed": true, "detail": "..." }],
  "codeReview": [{ "requirement": "...", "passed": true, "detail": "..." }],
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
    const sandboxToken = await ctx.runAction(
      internal.sandboxJwt.signSandboxToken,
      { userId: args.userId },
    );
    const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);

    await launchScript(
      sandbox,
      args.prompt,
      "taskWorkflow:handleAuditCompletion",
      "taskId",
      sandboxToken,
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

export const runSessionAudit = internalAction({
  args: {
    sessionId: v.id("sessions"),
    sandboxId: v.string(),
    auditId: v.id("sessionAudits"),
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

      const sandboxToken = await ctx.runAction(
        internal.sandboxJwt.signSandboxToken,
        { userId: args.userId },
      );
      const sandbox = await getSandbox(ctx, session.repoId, args.sandboxId);

      const diffRaw = await exec(
        sandbox,
        `cd ${WORKSPACE_DIR} && git diff HEAD~1..HEAD 2>/dev/null || echo ""`,
        30,
      );

      if (!diffRaw.trim()) {
        await ctx.runMutation(internal.sessionAudits.fail, {
          id: args.auditId,
          error: "No changes detected",
        });
        return null;
      }

      await launchScript(
        sandbox,
        buildSessionAuditPrompt(diffRaw),
        "sessionAudits:handleCompletion",
        "sessionId",
        sandboxToken,
        String(args.sessionId),
        {
          model: "haiku",
          claudeSessionId: sessionClaudeUuid(args.sessionId),
        },
      );
    } catch (err) {
      await ctx.runMutation(internal.sessionAudits.fail, {
        id: args.auditId,
        error: errorMessage(err, "Audit failed"),
      });
    }
    return null;
  },
});
