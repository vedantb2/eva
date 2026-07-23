"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { getSandboxHandle, errorMessage, signAndLaunchScript } from "./helpers";
import { sessionClaudeUuid } from "./agentRuntimePaths";
import { getTaskAuditStreamingEntityId } from "../_taskWorkflow/helpers";
import { buildAuditFixPrompt } from "../_taskWorkflow/prompts";
import { auditFailureValidator } from "../validators";

/** Shared Claude runner timeout env vars applied to every audit launch. */
const AUDIT_TIMEOUT_ENV_VARS = {
  CLAUDE_FIRST_EVENT_TIMEOUT_MS: "30000",
  CLAUDE_POST_TEXT_STALL_TIMEOUT_MS: "30000",
  CLAUDE_NO_OUTPUT_TIMEOUT_MS: "30000",
  CLAUDE_MAX_TOTAL_RUNTIME_MS: "600000",
};

/** Builds the system prompt for a session audit given a list of audit categories. */
function buildSessionAuditPrompt(
  categories: Array<{ name: string; description: string }>,
): string {
  const sectionDescriptions = categories
    .map((s, i) => `${i + 1}. **${s.name}**: ${s.description}`)
    .join("\n");

  const sectionJson = categories
    .map(
      (s) =>
        `    { "name": "${s.name}", "results": [{ "requirement": "...", "passed": true, "detail": "...", "severity": "medium" }] }`,
    )
    .join(",\n");

  return `You are a code auditor. Audit the changes made in this branch.

Focus ONLY on the changes in this branch — use git diff against the base branch to identify what was changed. You have full access to the repository, so read files, run skills, and use any tools you need to perform a thorough audit.

## Audit categories:
${sectionDescriptions}

For each category, produce a list of findings. Each finding should have a requirement name, whether it passed, a 1-sentence explanation, and a severity level ("critical", "high", "medium", or "low").

Severity guidelines:
- **critical**: Security vulnerabilities, data loss risks, broken core functionality
- **high**: Significant bugs, performance issues, accessibility violations
- **medium**: Code quality issues, missing tests, minor bugs
- **low**: Style issues, minor improvements, nice-to-haves

When you are done, output ONLY valid JSON in this exact format:
{
  "sections": [
${sectionJson}
  ],
  "summary": "1-2 sentence overall assessment"
}`;
}

/** Launches an audit agent on a sandbox to review branch changes. */
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
    const sandbox = await getSandboxHandle(ctx, args.repoId, args.sandboxId);
    const repo = await ctx.runQuery(internal.githubRepos.getInternal, {
      id: args.repoId,
    });

    await signAndLaunchScript(
      ctx,
      sandbox,
      args.userId,
      args.prompt,
      "taskWorkflow:handleAuditCompletion",
      "taskId",
      args.taskId,
      args.repoId,
      {
        model: repo?.auditReviewModel ?? "haiku",
        extraEnvVars: {
          STREAMING_ENTITY_ID: getTaskAuditStreamingEntityId(args.runId),
          RUN_ID: String(args.runId),
          ...AUDIT_TIMEOUT_ENV_VARS,
        },
        enableMcp: false,
      },
    );

    return null;
  },
});

/** Launches an agent to fix issues found during an audit. */
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
    const sandbox = await getSandboxHandle(ctx, args.repoId, args.sandboxId);
    const repo = await ctx.runQuery(internal.githubRepos.getInternal, {
      id: args.repoId,
    });

    await signAndLaunchScript(
      ctx,
      sandbox,
      args.userId,
      args.prompt,
      "taskWorkflow:handleAuditFixCompletion",
      "taskId",
      args.taskId,
      args.repoId,
      {
        model: repo?.auditFixModel ?? "sonnet",
        allowedTools: "Read,Write,Edit,Bash,Glob,Grep",
        extraEnvVars: {
          STREAMING_ENTITY_ID: getTaskAuditStreamingEntityId(args.runId),
          RUN_ID: String(args.runId),
          ...AUDIT_TIMEOUT_ENV_VARS,
        },
        enableMcp: false,
      },
    );

    return null;
  },
});

/** Creates or reuses a sandbox and launches fixes for selected audit failures. */
export const launchSelectedAuditFixes = internalAction({
  args: {
    auditId: v.id("audits"),
    selectedFailures: v.array(auditFailureValidator),
    sandboxId: v.optional(v.string()),
    taskId: v.id("agentTasks"),
    runId: v.id("agentRuns"),
    userId: v.id("users"),
    repoId: v.id("githubRepos"),
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.string(),
    rootDirectory: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const repo = await ctx.runQuery(internal.githubRepos.getInternal, {
        id: args.repoId,
      });
      let sandboxId = args.sandboxId;

      if (sandboxId) {
        const { healthy } = await ctx.runAction(
          internal.sandbox.validateSandbox,
          { sandboxId, repoId: args.repoId },
        );
        if (!healthy) {
          sandboxId = undefined;
        }
      }

      if (!sandboxId) {
        // Original task/project sandbox was unhealthy or gone. Spin up a
        // persistent replacement (not ephemeral) and write it back so future
        // runs / reviewer Start Sandbox reuse the same paused filesystem.
        const result = await ctx.runAction(
          internal.sandbox.createOrResumeSandbox,
          {
            installationId: args.installationId,
            repoOwner: args.repoOwner,
            repoName: args.repoName,
            branchName: args.branchName,
            ephemeral: false,
            repoId: args.repoId,
          },
        );
        sandboxId = result.sandboxId;
        await ctx.runMutation(internal.audits.saveAuditFixSandboxId, {
          taskId: args.taskId,
          sandboxId,
          vercelSandboxId: result.vercelSandboxId,
        });
      }

      const prompt = buildAuditFixPrompt(
        args.selectedFailures,
        args.branchName,
        args.rootDirectory,
      );

      if (!sandboxId) {
        throw new Error("Failed to create or resume sandbox for audit fix");
      }
      const sandbox = await getSandboxHandle(ctx, args.repoId, sandboxId);

      await signAndLaunchScript(
        ctx,
        sandbox,
        args.userId,
        prompt,
        "taskWorkflow:handleAuditFixCompletion",
        "taskId",
        String(args.taskId),
        args.repoId,
        {
          model: repo?.auditFixModel ?? "sonnet",
          allowedTools: "Read,Write,Edit,Bash,Glob,Grep",
          extraEnvVars: {
            STREAMING_ENTITY_ID: getTaskAuditStreamingEntityId(args.runId),
            RUN_ID: String(args.runId),
            ...AUDIT_TIMEOUT_ENV_VARS,
          },
          enableMcp: false,
        },
      );
    } catch (err) {
      console.error("Audit fix launch failed:", err);
      await ctx.runMutation(internal.taskWorkflow.setFixStatus, {
        auditId: args.auditId,
        fixStatus: "fix_error",
      });
    }

    return null;
  },
});

/** Runs an audit on a session's sandbox using enabled audit categories. */
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

      const sandbox = await getSandboxHandle(
        ctx,
        session.repoId,
        args.sandboxId,
      );
      const repo = await ctx.runQuery(internal.githubRepos.getInternal, {
        id: session.repoId,
      });

      const categories = await ctx.runQuery(
        internal.auditCategories.listEnabledForContext,
        { repoId: session.repoId },
      );

      if (categories.length === 0) {
        await ctx.runMutation(internal.audits.fail, {
          id: args.auditId,
          error: "No audit categories enabled",
        });
        return null;
      }

      await signAndLaunchScript(
        ctx,
        sandbox,
        args.userId,
        buildSessionAuditPrompt(categories),
        "audits:handleSessionCompletion",
        "sessionId",
        String(args.sessionId),
        session.repoId,
        {
          model: repo?.auditReviewModel ?? "haiku",
          claudeSessionId: sessionClaudeUuid(args.sessionId),
          extraEnvVars: { ...AUDIT_TIMEOUT_ENV_VARS },
          enableMcp: false,
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

/**
 * Runs an audit on a task/project sandbox after a chat turn. Detached like the
 * session audit (the chat workflow does not await it). Takes the typed entity id
 * so it can derive the Claude session uuid and route the completion callback to
 * the right entity field ("taskId"/"projectId").
 */
export const runChatAudit = internalAction({
  args: {
    taskId: v.optional(v.id("agentTasks")),
    projectId: v.optional(v.id("projects")),
    repoId: v.id("githubRepos"),
    sandboxId: v.string(),
    auditId: v.id("audits"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const entity = args.taskId ?? args.projectId;
    if (!entity) {
      await ctx.runMutation(internal.audits.fail, {
        id: args.auditId,
        error: "No entity for chat audit",
      });
      return null;
    }
    const entityIdField = args.taskId ? "taskId" : "projectId";
    try {
      const sandbox = await getSandboxHandle(ctx, args.repoId, args.sandboxId);
      const repo = await ctx.runQuery(internal.githubRepos.getInternal, {
        id: args.repoId,
      });
      const categories = await ctx.runQuery(
        internal.auditCategories.listEnabledForContext,
        { repoId: args.repoId },
      );
      if (categories.length === 0) {
        await ctx.runMutation(internal.audits.fail, {
          id: args.auditId,
          error: "No audit categories enabled",
        });
        return null;
      }

      await signAndLaunchScript(
        ctx,
        sandbox,
        args.userId,
        buildSessionAuditPrompt(categories),
        "audits:handleChatAuditCompletion",
        entityIdField,
        String(entity),
        args.repoId,
        {
          model: repo?.auditReviewModel ?? "haiku",
          claudeSessionId: sessionClaudeUuid(entity),
          extraEnvVars: { ...AUDIT_TIMEOUT_ENV_VARS },
          enableMcp: false,
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
