import { v } from "convex/values";
import { internalMutation, internalQuery, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { defineEvent, type WorkflowId } from "@convex-dev/workflow";
import { workflow } from "./workflowManager";
import { authMutation } from "./functions";
import { sessionModeValidator } from "./validators";

// --- Completion event ---

const sessionCompleteEvent = defineEvent({
  name: "sessionComplete",
  validator: v.object({
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
  }),
});

// --- Mode config ---

const MODE_TOOLS: Record<"ask" | "plan" | "execute", string> = {
  ask: "Read,Glob,Grep",
  plan: "Read,Write,Glob,Grep",
  execute: "Read,Write,Edit,Bash,Glob,Grep",
};

const WORKSPACE_DIR = "/workspace/repo";

// --- Prompt builders ---

function getResponseLengthInstruction(responseLength: string): string {
  if (responseLength === "concise")
    return "\n\n## Response Length\nKeep your response very concise and brief. Use short sentences, bullet points where possible, and avoid unnecessary detail.";
  if (responseLength === "detailed")
    return "\n\n## Response Length\nProvide a detailed and thorough response. Include examples, explanations, and supporting context where helpful.";
  return "";
}

function buildAskPrompt(
  repo: { owner: string; name: string },
  conversationHistory: string,
  message: string,
  responseLength: string,
): string {
  return `You are answering questions about a codebase for a non-technical user. This is READ-ONLY mode.

Repository: ${repo.owner}/${repo.name}

Previous conversation:
${conversationHistory || "None"}

Question: ${message}

How to find information:
- Use Glob to find files
- Use Grep to search for patterns
- Use Read to examine files

CRITICAL response rules:
- Keep your answer SHORT (2-4 sentences max)
- Use PLAIN TEXT only, no markdown formatting, no headers, no bullet points, no code blocks
- Write for someone who does NOT know programming - avoid technical jargon
- If you must mention a file, just say the filename without the full path
- Be direct and answer the question simply
- DO NOT modify any files${getResponseLengthInstruction(responseLength)}`;
}

function buildPlanPrompt(
  repo: { owner: string; name: string },
  conversationHistory: string,
  existingPlan: string,
  message: string,
  responseLength: string,
): string {
  return `You are a product planning assistant helping define a PRD (Product Requirements Document) for a feature or change. You iteratively refine the plan based on user feedback until they approve it.

## Repository: ${repo.owner}/${repo.name}

## Previous Conversation:
${conversationHistory || "None"}

## Current plan.md contents:
${existingPlan || "No plan created yet."}

## User Message:
${message}

## Instructions:
1. Use Glob, Grep, Read to explore the codebase and understand what already exists
2. Create or update plan.md in the repository root with the full PRD
3. Refine the existing plan based on user feedback — don't rewrite from scratch unless asked
4. Structure plan.md with: Overview, Goals, User Stories, Acceptance Criteria, Scope, Out of Scope

## Rules:
- You may ONLY write to plan.md — do NOT modify any other files
- Keep your conversational response SHORT (1-2 sentences summarizing what changed in the plan)
- Write for a non-technical audience — focus on WHAT to build and WHY, not HOW
- Do NOT commit or push any changes${getResponseLengthInstruction(responseLength)}`;
}

function buildExecutePrompt(
  repo: { owner: string; name: string },
  branchName: string,
  planContent: string,
  message: string,
  responseLength: string,
): string {
  const commitMessage = message.slice(0, 50).replace(/"/g, '\\"');
  const planContext = planContent
    ? `\n\n## Approved Product Plan:\n${planContent}\n\nUse this plan as context for what to build and why. Follow the goals, user stories, and acceptance criteria defined above.`
    : "";
  return `You are working on an ongoing session. The user has requested the following task:

## User Request:
${message}

## Repository: ${repo.owner}/${repo.name}
## Branch: ${branchName}

IMPORTANT: You are already on branch "${branchName}". All work MUST stay on this branch. NEVER checkout or push to main.${planContext}

## Instructions:
1. Read the CLAUDE.md file if it exists to understand the codebase
2. Use Glob and Read tools to explore and find relevant files
3. Make the requested changes using Edit or Write tools
4. Commit your changes with: git add -A && git commit -m "task: ${commitMessage}"
5. Push the changes with: git push -u origin ${branchName}
6. Respond with a summary of what you did

## Rules:
- You MUST commit and push ONLY to the branch "${branchName}" — NEVER push to main
- Do NOT checkout main or any other branch
- Do NOT create PRs - just commit and push
- Do NOT run build, lint, test, or dev commands
- Make minimal, focused changes
- Use the repository's lockfile to determine the correct package manager
- The GITHUB_TOKEN environment variable is set for git operations${getResponseLengthInstruction(responseLength)}`;
}

// --- Diff parsing ---

function parseDiffOutput(raw: string): Array<{
  file: string;
  status: string;
  diff: string;
}> {
  if (!raw.trim()) return [];

  const chunks = raw.split(/(?=^diff --git )/m).filter(Boolean);
  const MAX_TOTAL = 50_000;
  let totalSize = 0;
  const diffs: Array<{ file: string; status: string; diff: string }> = [];

  for (const chunk of chunks) {
    const fileMatch = chunk.match(/^diff --git a\/.+ b\/(.+)$/m);
    if (!fileMatch) continue;

    const file = fileMatch[1];
    let status = "modified";
    if (chunk.includes("--- /dev/null")) status = "added";
    else if (chunk.includes("+++ /dev/null")) status = "deleted";

    if (totalSize + chunk.length > MAX_TOTAL) break;
    totalSize += chunk.length;
    diffs.push({ file, status, diff: chunk });
  }

  return diffs;
}

// --- Workflow ---

const sessionModeArgValidator = v.union(
  v.literal("execute"),
  v.literal("ask"),
  v.literal("plan"),
);

export const sessionExecuteWorkflow = workflow.define({
  args: {
    sessionId: v.id("sessions"),
    message: v.string(),
    mode: sessionModeArgValidator,
    model: v.string(),
    responseLength: v.string(),
    convexToken: v.string(),
    installationId: v.number(),
  },
  handler: async (step, args): Promise<void> => {
    // Step 1: Add empty assistant placeholder (user message already added by frontend)
    await step.runMutation(internal.sessionWorkflow.addAssistantPlaceholder, {
      sessionId: args.sessionId,
      mode: args.mode,
    });

    // Step 2: Fetch session/repo data and build prompt
    const data = await step.runQuery(internal.sessionWorkflow.getSessionData, {
      sessionId: args.sessionId,
      message: args.message,
      mode: args.mode,
      model: args.model,
      responseLength: args.responseLength,
    });

    // Step 3: Setup sandbox + fire Claude CLI
    const { sandboxId } = await step.runAction(
      internal.daytona.setupAndExecute,
      {
        entityId: args.sessionId,
        existingSandboxId: data.sandboxId,
        installationId: args.installationId,
        repoOwner: data.repoOwner,
        repoName: data.repoName,
        prompt: data.prompt,
        convexToken: args.convexToken,
        completionMutation: "sessionWorkflow:handleCompletion",
        entityIdField: "sessionId",
        model: data.model,
        allowedTools: data.allowedTools,
        branchName: data.branchName,
        repoId: data.repoId,
        sessionPersistenceId: args.sessionId,
      },
      { retry: { maxAttempts: 2, initialBackoffMs: 2000, base: 2 } },
    );

    // Step 4: Persist sandbox ID if changed
    if (sandboxId !== data.sandboxId) {
      await step.runMutation(internal.sessionWorkflow.updateSandboxId, {
        sessionId: args.sessionId,
        sandboxId,
        branchName: data.branchName,
      });
    }

    // Step 5: Wait for sandbox callback
    const result = await step.awaitEvent(sessionCompleteEvent);

    // Step 6: Post-completion mode-specific operations
    let fileDiffs: string | undefined;
    let planContent: string | undefined;

    if (args.mode === "execute" && result.success && sandboxId) {
      const diffRaw = await step.runAction(internal.daytona.runSandboxCommand, {
        sandboxId,
        command: `cd ${WORKSPACE_DIR} && git diff HEAD~1..HEAD 2>/dev/null || echo ""`,
        timeoutSeconds: 30,
        repoId: data.repoId,
      });
      const diffs = parseDiffOutput(diffRaw);
      if (diffs.length > 0) {
        fileDiffs = JSON.stringify(diffs);
      }
    }

    if (args.mode === "plan" && result.success && sandboxId) {
      const planRaw = await step.runAction(internal.daytona.runSandboxCommand, {
        sandboxId,
        command: `cat ${WORKSPACE_DIR}/plan.md 2>/dev/null || echo ""`,
        timeoutSeconds: 10,
        repoId: data.repoId,
      });
      if (planRaw.trim()) {
        planContent = planRaw.trim();
      }
    }

    // Step 7: Save result
    await step.runMutation(internal.sessionWorkflow.saveResult, {
      sessionId: args.sessionId,
      success: result.success,
      result: result.result,
      error: result.error,
      activityLog: result.activityLog,
      fileDiffs,
      planContent,
    });
  },
});

// --- Supporting internal functions ---

export const addAssistantPlaceholder = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    mode: sessionModeArgValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    await ctx.db.patch(args.sessionId, {
      messages: [
        ...session.messages,
        {
          role: "assistant" as const,
          content: "",
          timestamp: Date.now(),
          mode: args.mode,
          activityLog: "",
        },
      ],
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const getSessionData = internalQuery({
  args: {
    sessionId: v.id("sessions"),
    message: v.string(),
    mode: sessionModeArgValidator,
    model: v.string(),
    responseLength: v.string(),
  },
  returns: v.object({
    sandboxId: v.optional(v.string()),
    repoOwner: v.string(),
    repoName: v.string(),
    repoId: v.id("githubRepos"),
    prompt: v.string(),
    branchName: v.optional(v.string()),
    allowedTools: v.string(),
    model: v.string(),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    const repo = await ctx.db.get(session.repoId);
    if (!repo) throw new Error("Repository not found");

    const branchName =
      args.mode === "ask"
        ? undefined
        : session.branchName || `session/${args.sessionId}`;

    // Build conversation history (last 10 messages of same mode)
    const conversationHistory = session.messages
      .filter((m) => m.mode === args.mode)
      .slice(-10)
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n\n");

    let prompt: string;
    if (args.mode === "ask") {
      prompt = buildAskPrompt(
        { owner: repo.owner, name: repo.name },
        conversationHistory,
        args.message,
        args.responseLength,
      );
    } else if (args.mode === "plan") {
      prompt = buildPlanPrompt(
        { owner: repo.owner, name: repo.name },
        conversationHistory,
        session.planContent || "",
        args.message,
        args.responseLength,
      );
    } else {
      prompt = buildExecutePrompt(
        { owner: repo.owner, name: repo.name },
        branchName || "",
        session.planContent || "",
        args.message,
        args.responseLength,
      );
    }

    return {
      sandboxId: session.sandboxId,
      repoOwner: repo.owner,
      repoName: repo.name,
      repoId: session.repoId,
      prompt,
      branchName,
      allowedTools: MODE_TOOLS[args.mode],
      model: args.model,
    };
  },
});

export const updateSandboxId = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    sandboxId: v.string(),
    branchName: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const updates: {
      sandboxId: string;
      branchName?: string;
      updatedAt: number;
    } = {
      sandboxId: args.sandboxId,
      updatedAt: Date.now(),
    };
    if (args.branchName) {
      updates.branchName = args.branchName;
    }
    await ctx.db.patch(args.sessionId, updates);
    return null;
  },
});

export const saveResult = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
    fileDiffs: v.optional(v.string()),
    planContent: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Clear streaming activity
    const streaming = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", String(args.sessionId)))
      .first();
    if (streaming) await ctx.db.delete(streaming._id);

    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    // Update last assistant message with result
    const messages = [...session.messages];
    const last = messages[messages.length - 1];
    if (!last) return null;

    if (args.success) {
      last.content = args.result || "I couldn't process your message.";
    } else {
      last.content = `Error: ${args.error || "Unknown error during execution."}`;
    }
    if (args.activityLog) {
      last.activityLog = args.activityLog;
    }

    // Build patch
    const patch: {
      messages: typeof messages;
      activeWorkflowId?: string;
      updatedAt: number;
      fileDiffs?: Array<{ file: string; status: string; diff: string }>;
      planContent?: string;
    } = {
      messages,
      activeWorkflowId: undefined,
      updatedAt: Date.now(),
    };

    if (args.fileDiffs) {
      const parsed: Array<{ file: string; status: string; diff: string }> =
        JSON.parse(args.fileDiffs);
      patch.fileDiffs = parsed;
    }

    if (args.planContent) {
      patch.planContent = args.planContent;
    }

    await ctx.db.patch(args.sessionId, patch);
    return null;
  },
});

/**
 * Called by the sandbox via Convex HTTP API (authenticated with Clerk JWT).
 * Routes the completion event to the waiting workflow.
 */
export const handleCompletion = authMutation({
  args: {
    sessionId: v.id("sessions"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || !session.activeWorkflowId) return null;
    if (session.userId !== ctx.userId) throw new Error("Not authorized");

    await workflow.sendEvent(ctx, {
      ...sessionCompleteEvent,
      workflowId: session.activeWorkflowId as WorkflowId,
      value: {
        success: args.success,
        result: args.result,
        error: args.error,
        activityLog: args.activityLog,
      },
    });

    return null;
  },
});

/**
 * Frontend trigger — starts the session execution workflow.
 */
export const startExecute = authMutation({
  args: {
    sessionId: v.id("sessions"),
    message: v.string(),
    mode: sessionModeValidator,
    model: v.string(),
    responseLength: v.string(),
    convexToken: v.string(),
    installationId: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (session.userId !== ctx.userId) throw new Error("Not authorized");

    // Only allow ask, plan, execute modes
    if (
      args.mode !== "ask" &&
      args.mode !== "plan" &&
      args.mode !== "execute"
    ) {
      throw new Error(`Unsupported mode: ${args.mode}`);
    }

    const workflowId = await workflow.start(
      ctx,
      internal.sessionWorkflow.sessionExecuteWorkflow,
      {
        sessionId: args.sessionId,
        message: args.message,
        mode: args.mode,
        model: args.model,
        responseLength: args.responseLength,
        convexToken: args.convexToken,
        installationId: args.installationId,
      },
    );

    await ctx.db.patch(args.sessionId, {
      activeWorkflowId: String(workflowId),
    });

    return null;
  },
});

/**
 * Cancel an active session workflow.
 */
export const cancelExecution = authMutation({
  args: {
    sessionId: v.id("sessions"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (session.userId !== ctx.userId) throw new Error("Not authorized");

    if (session.activeWorkflowId) {
      await workflow.cancel(ctx, session.activeWorkflowId as WorkflowId);
    }

    // Update last message with cancelled notice
    const messages = [...session.messages];
    const last = messages[messages.length - 1];
    if (last && last.role === "assistant" && !last.content) {
      last.content = "Execution cancelled by user.";
    }

    // Clear streaming activity
    const streaming = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", String(args.sessionId)))
      .first();
    if (streaming) await ctx.db.delete(streaming._id);

    await ctx.db.patch(args.sessionId, {
      messages,
      activeWorkflowId: undefined,
      updatedAt: Date.now(),
    });

    return null;
  },
});
