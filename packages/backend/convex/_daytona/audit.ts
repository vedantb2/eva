"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { getSandbox, errorMessage, signAndLaunchScript } from "./helpers";
import { sessionClaudeUuid } from "./volumes";
import { getTaskAuditStreamingEntityId } from "../_taskWorkflow/helpers";

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
    const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);

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
    const sandbox = await getSandbox(ctx, args.repoId, args.sandboxId);

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

/** Creates or reuses a sandbox and launches fixes for selected audit failures. */
export const launchSelectedAuditFixes = internalAction({
  args: {
    auditId: v.id("audits"),
    selectedFailures: v.array(
      v.object({
        section: v.string(),
        requirement: v.string(),
        detail: v.string(),
        severity: v.union(
          v.literal("critical"),
          v.literal("high"),
          v.literal("medium"),
          v.literal("low"),
        ),
      }),
    ),
    sandboxId: v.optional(v.string()),
    taskId: v.string(),
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
      let sandboxId = args.sandboxId;

      if (sandboxId) {
        const { healthy } = await ctx.runAction(
          internal.daytona.validateSandbox,
          { sandboxId, repoId: args.repoId },
        );
        if (!healthy) {
          sandboxId = undefined;
        }
      }

      if (!sandboxId) {
        const result = await ctx.runAction(
          internal.daytona.createOrResumeSandbox,
          {
            installationId: args.installationId,
            repoOwner: args.repoOwner,
            repoName: args.repoName,
            branchName: args.branchName,
            ephemeral: true,
            repoId: args.repoId,
          },
        );
        sandboxId = result.sandboxId;
      }

      const failureList = args.selectedFailures
        .map(
          (f, i) =>
            `${i + 1}. [${f.severity.toUpperCase()}] [${f.section}] ${f.requirement}: ${f.detail}`,
        )
        .join("\n");

      const rootDirInstruction = args.rootDirectory
        ? `\n- Root directory: \`${args.rootDirectory}\` — cd there before doing anything`
        : "";

      const prompt = `You are fixing audit failures found in a post-implementation code audit. Fix ALL of the following issues to get all audit scores to 100%.

## Failed Audit Items:
${failureList}

## Instructions:
1. Read the CLAUDE.md file to understand the codebase
2. Read the relevant files to understand context around each failure
3. Fix each issue listed above with minimal, focused changes
4. Run the build command (e.g. npm run build / pnpm build) to verify there are no build errors. If there are errors, fix them and re-run the build until it passes cleanly.
5. Run: git add -A -- ':!*.png' ':!*.jpg' ':!*.jpeg' ':!*.gif' ':!*.webp' ':!*.webm' ':!*.mp4' ':!*.mov' ':!screenshots/' ':!recordings/' && git commit -m "audit: fix ${args.selectedFailures.length} issue${args.selectedFailures.length === 1 ? "" : "s"}"
6. Run: git push origin ${args.branchName}

## Rules:
- Only fix the specific issues listed above — do NOT refactor or change unrelated code
- Keep changes minimal and focused
- Use lockfile for package manager. GITHUB_TOKEN is set.
- Prefix shell commands with \`timeout <seconds>\` (e.g. \`timeout 30 npm install\`)
- NEVER use \`sleep\` or \`2>/dev/null\` without \`|| echo "fallback"\`${rootDirInstruction}`;

      const sandbox = await getSandbox(ctx, args.repoId, sandboxId);

      await signAndLaunchScript(
        ctx,
        sandbox,
        args.userId,
        prompt,
        "taskWorkflow:handleAuditFixCompletion",
        "taskId",
        args.taskId,
        args.repoId,
        {
          model: "sonnet",
          allowedTools: "Read,Write,Edit,Bash,Glob,Grep",
          extraEnvVars: {
            STREAMING_ENTITY_ID: getTaskAuditStreamingEntityId(args.runId),
            RUN_ID: String(args.runId),
          },
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

      const sandbox = await getSandbox(ctx, session.repoId, args.sandboxId);

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
