import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { defineEvent, type WorkflowId } from "@convex-dev/workflow";
import { workflow } from "./workflowManager";
import { authMutation, hasRepoAccess } from "./functions";
import {
  aiModelValidator,
  sessionModeValidator,
  workflowCompleteValidator,
  normalizeAIModel,
} from "./validators";
import { RUN_TIMEOUT_MS } from "./workflowWatchdog";
import { clearStreamingActivity } from "./_taskWorkflow/helpers";
import { startNextQueuedSessionMessage } from "./_queues/helpers";
import {
  buildRootDirectoryInstruction,
  buildCustomInstructionsBlock,
  getResponseLengthInstruction,
} from "./prompts";

// --- Completion event ---

const sessionCompleteEvent = defineEvent({
  name: "sessionComplete",
  validator: workflowCompleteValidator,
});

// --- Mode config ---

const MODE_TOOLS: Record<"edit" | "plan", string> = {
  edit: "Read,Write,Edit,Bash,Glob,Grep",
  plan: "Read,Write,Glob,Grep",
};

const WORKSPACE_DIR = "/tmp/repo";
const LEGACY_WORKSPACE_DIR = "/workspace/repo";

// --- Prompt builders ---

/** Builds a plan-mode prompt for creating or refining a plan.md document. */
function buildPlanPrompt(
  repo: { owner: string; name: string },
  existingPlan: string,
  message: string,
  responseLength: string,
  rootDirectory: string,
  customInstructionsBlock: string,
): string {
  return `PRD planning for ${repo.owner}/${repo.name}. Explore with Glob, Grep, Read.

Current plan.md:
${existingPlan || "None yet."}

User: ${message}

Create/update plan.md with: Overview, Goals, User Stories, Acceptance Criteria, Scope, Out of Scope. Refine iteratively — don't rewrite unless asked.

Rules:
- ONLY write plan.md — no other files
- Respond with 1-2 sentences on what changed
- Non-technical: WHAT and WHY, not HOW
- Do NOT commit or push${getResponseLengthInstruction(responseLength, "plan")}${customInstructionsBlock}${buildRootDirectoryInstruction(rootDirectory)}`;
}

/** Builds an edit-mode prompt with full read+write access for answering questions and making code changes. */
function buildEditPrompt(
  repo: { owner: string; name: string },
  branchName: string,
  planContent: string,
  message: string,
  responseLength: string,
  rootDirectory: string,
  customInstructionsBlock: string,
): string {
  const commitMessage = message.slice(0, 50).replace(/"/g, '\\"');
  const planContext = planContent
    ? `\n\nApproved plan:\n${planContent}\n\nFollow the goals, user stories, and acceptance criteria above.`
    : "";
  return `Full access to ${repo.owner}/${repo.name} on branch "${branchName}".${planContext}

${message}

Steps:
1. Read CLAUDE.md if it exists
2. Find relevant files with Glob, Grep, Read
3. If changes are needed, make them with Edit or Write
4. If code changed, commit and push:
   git add -A -- ':!*.png' ':!*.jpg' ':!*.jpeg' ':!*.gif' ':!*.webp' ':!*.webm' ':!*.mp4' ':!*.mov' ':!screenshots/' ':!recordings/' && git diff --cached --quiet || git commit -m "task: ${commitMessage}" && git push -u origin ${branchName}

Rules:
- ONLY work on "${branchName}" — never interact with main
- If the user is asking a question, answer it — don't make unnecessary changes
- No PRs, no build/lint/test/dev commands, no commit if no source changed
- Never commit images/video. Minimal, focused changes. Use lockfile. GITHUB_TOKEN is set.
- Respond as business outcome, no code/paths/jargon (e.g. "Added dark mode toggle. Pushed to branch.")
- No commit hashes or process commentary
- Browser: use agent-browser skill. Check CDP first: \`curl -sf http://localhost:9222/json/version > /dev/null && echo "CDP" || echo "NO_CDP"\`. CDP → \`agent-browser --cdp 9222\` (skip viewport). No CDP → \`agent-browser set viewport 1920 1080\` first. Always \`--annotate\`. Save to screenshots/ or recordings/.${getResponseLengthInstruction(responseLength, "edit")}${customInstructionsBlock}${buildRootDirectoryInstruction(rootDirectory)}`;
}

// --- Workflow ---

// Accepts legacy "ask"/"execute" for in-flight queued messages — treated as "edit" in handlers
const sessionModeArgValidator = v.union(
  v.literal("edit"),
  v.literal("ask"),
  v.literal("execute"),
  v.literal("plan"),
);

/** Starts a session sandbox (clone + branch setup) as a durable workflow step. */
export const sessionSandboxStartupWorkflow = workflow.define({
  args: {
    sessionId: v.id("sessions"),
    existingSandboxId: v.optional(v.string()),
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.string(),
    baseBranch: v.string(),
    repoId: v.id("githubRepos"),
  },
  handler: async (step, args): Promise<void> => {
    await step.runAction(internal.daytona.startSessionSandbox, {
      sessionId: args.sessionId,
      existingSandboxId: args.existingSandboxId,
      installationId: args.installationId,
      repoOwner: args.repoOwner,
      repoName: args.repoName,
      branchName: args.branchName,
      baseBranch: args.baseBranch,
      repoId: args.repoId,
    });
  },
});

/** Runs a session message through the sandbox agent in the specified mode (ask/plan/execute). */
export const sessionExecuteWorkflow = workflow.define({
  args: {
    sessionId: v.id("sessions"),
    message: v.string(),
    mode: sessionModeArgValidator,
    model: aiModelValidator,
    responseLength: v.string(),
    userId: v.id("users"),
    installationId: v.number(),
  },
  handler: async (step, args): Promise<void> => {
    await step.runMutation(internal.sessionWorkflow.addAssistantPlaceholder, {
      sessionId: args.sessionId,
      mode: args.mode,
    });

    const data = await step.runQuery(internal.sessionWorkflow.getSessionData, {
      sessionId: args.sessionId,
      message: args.message,
      mode: args.mode,
      model: args.model,
      responseLength: args.responseLength,
    });

    let validatedSandboxId: string | null = null;

    if (data.sandboxId) {
      const validation = await step.runAction(
        internal.daytona.validateSandbox,
        { sandboxId: data.sandboxId, repoId: data.repoId },
        { retry: false },
      );
      validatedSandboxId = validation.healthy ? data.sandboxId : null;
    }

    let sandboxId: string;

    if (validatedSandboxId) {
      sandboxId = validatedSandboxId;
    } else {
      const prepared = await step.runAction(
        internal.daytona.prepareSessionSandbox,
        {
          sessionId: args.sessionId,
          existingSandboxId: data.sandboxId,
          installationId: args.installationId,
          repoOwner: data.repoOwner,
          repoName: data.repoName,
          branchName: data.branchName ?? `eva/session-${args.sessionId}`,
          baseBranch: data.baseBranch,
          repoId: data.repoId,
          startDesktop: true,
        },
        { retry: { maxAttempts: 2, initialBackoffMs: 2000, base: 2 } },
      );
      sandboxId = prepared.sandboxId;

      await step.runMutation(internal.sessionWorkflow.updateSandboxId, {
        sessionId: args.sessionId,
        sandboxId,
        branchName: data.branchName,
      });
    }

    await step.runAction(internal.daytona.launchOnExistingSandbox, {
      sandboxId,
      entityId: args.sessionId,
      prompt: data.prompt,
      userId: args.userId,
      completionMutation: "sessionWorkflow:handleCompletion",
      entityIdField: "sessionId",
      model: data.model,
      allowedTools: data.allowedTools,
      repoId: data.repoId,
      sessionPersistenceId: args.sessionId,
      streamingEntityId: args.sessionId,
    });

    const result = await step.awaitEvent(sessionCompleteEvent);

    let planContent: string | undefined;

    if (args.mode === "plan" && result.success && sandboxId) {
      const planRaw = await step.runAction(internal.daytona.runSandboxCommand, {
        sandboxId,
        command: `cat ${WORKSPACE_DIR}/plan.md 2>/dev/null || cat ${LEGACY_WORKSPACE_DIR}/plan.md 2>/dev/null || echo ""`,
        timeoutSeconds: 10,
        repoId: data.repoId,
      });
      if (planRaw.trim()) {
        planContent = planRaw.trim();
      }
    }

    await step.runMutation(internal.sessionWorkflow.saveResult, {
      sessionId: args.sessionId,
      success: result.success,
      result: result.result,
      error: result.error,
      activityLog: result.activityLog,
      planContent,
      pendingQuestion: result.pendingQuestion,
    });

    if (args.mode !== "plan" && result.success && data.branchName) {
      await step.runMutation(
        internal.sessionWorkflow.scheduleSessionDeploymentTracking,
        {
          sessionId: args.sessionId,
          installationId: args.installationId,
          repoOwner: data.repoOwner,
          repoName: data.repoName,
          branchName: data.branchName,
          deploymentProjectName: data.deploymentProjectName,
        },
      );
    }
  },
});

// --- Deployment tracking ---

/** Queues deployment status polling for a session branch after a successful execute. */
export const scheduleSessionDeploymentTracking = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    installationId: v.number(),
    repoOwner: v.string(),
    repoName: v.string(),
    branchName: v.string(),
    deploymentProjectName: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, { deploymentStatus: "queued" });
    await ctx.scheduler.runAfter(
      30_000,
      internal.taskWorkflowActions.pollSessionDeploymentStatus,
      {
        sessionId: args.sessionId,
        installationId: args.installationId,
        repoOwner: args.repoOwner,
        repoName: args.repoName,
        branchName: args.branchName,
        deploymentProjectName: args.deploymentProjectName,
        attempt: 0,
      },
    );
    return null;
  },
});

// --- Supporting internal functions ---

/** Inserts an empty assistant message into the session for streaming updates. */
export const addAssistantPlaceholder = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    mode: sessionModeArgValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    await ctx.db.insert("messages", {
      parentId: args.sessionId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      mode: args.mode,
      activityLog: "",
    });
    await ctx.db.patch(args.sessionId, { updatedAt: Date.now() });
    return null;
  },
});

/** Fetches session and repo data, builds the mode-specific prompt, and resolves branch/tools config. */
export const getSessionData = internalQuery({
  args: {
    sessionId: v.id("sessions"),
    message: v.string(),
    mode: sessionModeArgValidator,
    model: aiModelValidator,
    responseLength: v.string(),
  },
  returns: v.object({
    sandboxId: v.optional(v.string()),
    repoOwner: v.string(),
    repoName: v.string(),
    repoId: v.id("githubRepos"),
    prompt: v.string(),
    branchName: v.optional(v.string()),
    baseBranch: v.string(),
    allowedTools: v.string(),
    model: aiModelValidator,
    deploymentProjectName: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    const repo = await ctx.db.get(session.repoId);
    if (!repo) throw new Error("Repository not found");

    const rootDirectory = repo.rootDirectory ?? "";

    const user = await ctx.db.get(session.userId);
    const customInstructionsBlock = buildCustomInstructionsBlock(
      user?.role ?? undefined,
      user?.customInstructions ?? undefined,
    );

    // Normalize legacy "ask"/"execute" to "edit"
    const effectiveMode: "edit" | "plan" =
      args.mode === "plan" ? "plan" : "edit";

    const branchName = session.branchName || `eva/session-${args.sessionId}`;

    let prompt: string;
    if (effectiveMode === "plan") {
      prompt = buildPlanPrompt(
        { owner: repo.owner, name: repo.name },
        session.planContent || "",
        args.message,
        args.responseLength,
        rootDirectory,
        customInstructionsBlock,
      );
    } else {
      prompt = buildEditPrompt(
        { owner: repo.owner, name: repo.name },
        branchName,
        session.planContent || "",
        args.message,
        args.responseLength,
        rootDirectory,
        customInstructionsBlock,
      );
    }

    return {
      sandboxId: session.sandboxId,
      repoOwner: repo.owner,
      repoName: repo.name,
      repoId: session.repoId,
      prompt,
      branchName,
      baseBranch: repo.defaultBaseBranch ?? "main",
      allowedTools: MODE_TOOLS[effectiveMode],
      model: normalizeAIModel(args.model),
      deploymentProjectName: repo.deploymentProjectName,
    };
  },
});

/** Updates the session's sandbox ID and optionally its branch name after sandbox preparation. */
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

/** Saves the session execution result, updating the last message and starting queued messages. */
export const saveResult = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
    planContent: v.optional(v.string()),
    pendingQuestion: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await clearStreamingActivity(ctx, String(args.sessionId));

    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    const last = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.sessionId))
      .order("desc")
      .first();
    if (!last) return null;

    const patch: {
      content: string;
      activityLog?: string;
      finishedAt?: number;
      pendingQuestion?: string;
    } = {
      content: args.success
        ? args.result || "I couldn't process your message."
        : `Error: ${args.error || "Unknown error during execution."}`,
      finishedAt: Date.now(),
    };
    if (args.activityLog) {
      patch.activityLog = args.activityLog;
    }
    if (args.pendingQuestion) {
      patch.pendingQuestion = args.pendingQuestion;
    }
    await ctx.db.patch(last._id, patch);

    const sessionPatch: {
      activeWorkflowId?: string;
      updatedAt: number;
      planContent?: string;
    } = {
      activeWorkflowId: undefined,
      updatedAt: Date.now(),
    };
    if (args.planContent) {
      sessionPatch.planContent = args.planContent;
    }
    await ctx.db.patch(args.sessionId, sessionPatch);
    await startNextQueuedSessionMessage(ctx, args.sessionId);
    return null;
  },
});

/** Receives sandbox completion callback and forwards the event to the active session workflow. */
export const handleCompletion = authMutation({
  args: {
    sessionId: v.id("sessions"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
    rawResultEvent: v.optional(v.string()),
    pendingQuestion: v.optional(v.string()),
    errorType: v.optional(
      v.union(v.literal("rate_limit"), v.literal("generic")),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const completionStartedAt = Date.now();
    const session = await ctx.db.get(args.sessionId);
    if (!session || !session.activeWorkflowId) return null;
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId)))
      throw new Error("Not authorized");

    console.log(
      `[sessionWorkflow] handleCompletion received sessionId=${args.sessionId} success=${args.success} workflowId=${session.activeWorkflowId}`,
    );

    await workflow.sendEvent(ctx, {
      ...sessionCompleteEvent,
      workflowId: session.activeWorkflowId as WorkflowId,
      value: {
        success: args.success,
        result: args.result,
        error: args.error,
        activityLog: args.activityLog,
        pendingQuestion: args.pendingQuestion,
      },
    });

    await ctx.db.insert("logs", {
      entityType: "session",
      entityId: String(args.sessionId),
      entityTitle: session.title,
      rawResultEvent: args.rawResultEvent,
      repoId: session.repoId,
      createdAt: Date.now(),
    });

    console.log(
      `[sessionWorkflow] handleCompletion finished in ${Date.now() - completionStartedAt}ms sessionId=${args.sessionId}`,
    );

    return null;
  },
});

/** Frontend trigger to start a session execution workflow in the specified mode. */
export const startExecute = authMutation({
  args: {
    sessionId: v.id("sessions"),
    message: v.string(),
    mode: sessionModeValidator,
    model: aiModelValidator,
    responseLength: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId)))
      throw new Error("Not authorized");

    const normalizedMode =
      args.mode === "ask" || args.mode === "execute" ? "edit" : args.mode;
    if (normalizedMode !== "edit" && normalizedMode !== "plan") {
      throw new Error(`Unsupported mode: ${args.mode}`);
    }

    const repo = await ctx.db.get(session.repoId);
    if (!repo) throw new Error("Repository not found");

    const workflowId = await workflow.start(
      ctx,
      internal.sessionWorkflow.sessionExecuteWorkflow,
      {
        sessionId: args.sessionId,
        message: args.message,
        mode: args.mode,
        model: args.model,
        responseLength: args.responseLength,
        userId: ctx.userId,
        installationId: repo.installationId,
      },
    );

    await ctx.db.patch(args.sessionId, {
      activeWorkflowId: String(workflowId),
    });

    await ctx.scheduler.runAfter(
      RUN_TIMEOUT_MS,
      internal.workflowWatchdog.handleStaleSession,
      { sessionId: args.sessionId, workflowId: String(workflowId) },
    );

    return null;
  },
});

/** Queues a message to be processed after the current active workflow finishes. */
export const enqueueMessage = authMutation({
  args: {
    sessionId: v.id("sessions"),
    message: v.string(),
    mode: sessionModeValidator,
    model: aiModelValidator,
    responseLength: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const content = args.message.trim();
    if (!content) return null;

    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId)))
      throw new Error("Not authorized");

    await ctx.db.insert("queuedMessages", {
      parentId: args.sessionId,
      content,
      createdAt: Date.now(),
      userId: ctx.userId,
      mode: args.mode,
      model: args.model,
      responseLength: args.responseLength,
    });
    await ctx.db.patch(args.sessionId, { updatedAt: Date.now() });
    return null;
  },
});

/** Cancels the active session workflow, kills the sandbox process, and starts queued messages. */
export const cancelExecution = authMutation({
  args: {
    sessionId: v.id("sessions"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId)))
      throw new Error("Not authorized");

    if (session.activeWorkflowId) {
      await workflow.cancel(ctx, session.activeWorkflowId as WorkflowId);
    }

    if (session.sandboxId) {
      await ctx.scheduler.runAfter(0, internal.daytona.killSandboxProcess, {
        sandboxId: session.sandboxId,
        repoId: session.repoId,
      });
    }

    const streaming = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", String(args.sessionId)))
      .first();

    const last = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.sessionId))
      .order("desc")
      .first();
    if (last && last.role === "assistant") {
      const patch: {
        content?: string;
        activityLog?: string;
        finishedAt: number;
      } = {
        finishedAt: Date.now(),
      };
      if (!last.content) {
        patch.content = "Execution cancelled by user.";
      }
      if (streaming?.currentActivity) {
        patch.activityLog = streaming.currentActivity;
      }
      await ctx.db.patch(last._id, patch);
    }

    await clearStreamingActivity(ctx, String(args.sessionId));

    await ctx.db.patch(args.sessionId, {
      activeWorkflowId: undefined,
      updatedAt: Date.now(),
    });

    await startNextQueuedSessionMessage(ctx, args.sessionId);

    return null;
  },
});
