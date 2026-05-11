import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import { defineEvent } from "@convex-dev/workflow";
import { workflow } from "../workflowManager";
import { authMutation, hasRepoAccess } from "../functions";
import {
  aiModelValidator,
  workflowCompleteValidator,
  normalizeAIModel,
} from "../validators";
import { FALLBACK_GIT_BASE_BRANCH } from "@conductor/shared";
import {
  recordCompletionLog,
  sendCompletionEvent,
  clearStreamingActivity,
} from "../_taskWorkflow/helpers";
import { startNextQueuedSessionMessage } from "../_queues/helpers";
import { resolveDocMentions } from "../_mentions/resolveDocMentions";
import { buildCustomInstructionsBlock } from "../prompts";
import { buildPlanPrompt, buildEditPrompt } from "./prompts";

// --- Completion event ---

export const sessionCompleteEvent = defineEvent({
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

// Accepts legacy "ask"/"execute" for in-flight queued messages — treated as "edit" in handlers
export const sessionModeArgValidator = v.union(
  v.literal("edit"),
  v.literal("ask"),
  v.literal("execute"),
  v.literal("plan"),
);

// --- Workflows ---

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
      userId: args.userId,
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

    let savedSuccess = result.success;
    let savedError = result.error;

    if (args.mode !== "plan" && result.success && data.branchName) {
      try {
        await step.runAction(internal.daytona.pushSandboxBranch, {
          sandboxId,
          installationId: args.installationId,
          repoOwner: data.repoOwner,
          repoName: data.repoName,
          repoId: data.repoId,
          branchName: data.branchName,
        });
      } catch (error) {
        savedSuccess = false;
        savedError = `Session completed locally, but Eva could not publish the branch to GitHub. The sandbox was preserved for recovery. ${error instanceof Error ? error.message : String(error)}`;
        console.error(
          `[sessionWorkflow] pushSandboxBranch failed sessionId=${args.sessionId}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    await step.runMutation(internal.sessionWorkflow.saveResult, {
      sessionId: args.sessionId,
      success: savedSuccess,
      result: result.result,
      error: savedError,
      activityLog: result.activityLog,
      planContent,
      pendingQuestion: result.pendingQuestion,
    });

    if (args.mode !== "plan" && savedSuccess && data.branchName) {
      await step.runMutation(
        internal.sessionWorkflow.scheduleSessionDeploymentTracking,
        {
          sessionId: args.sessionId,
          installationId: args.installationId,
          repoOwner: data.repoOwner,
          repoName: data.repoName,
          repoId: data.repoId,
          branchName: data.branchName,
          deploymentProjectName: data.deploymentProjectName,
        },
      );

      // Create draft PR after successful execution (skips if PR already exists)
      try {
        await step.runAction(internal.github.createDraftSessionPr, {
          sessionId: args.sessionId,
        });
      } catch (error) {
        const errorDetail =
          error instanceof Error ? error.message : String(error);
        console.error(
          `[sessionWorkflow] createDraftSessionPr failed sessionId=${args.sessionId}: ${errorDetail}`,
        );
        await step.runMutation(internal.messages.addInternal, {
          parentId: args.sessionId,
          role: "assistant",
          content: "Failed to create draft PR",
          isSystemAlert: true,
          errorDetail,
        });
      }
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
    repoId: v.id("githubRepos"),
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
        repoId: args.repoId,
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
    userId: v.id("users"),
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

    const user = await ctx.db.get(args.userId);
    const customInstructionsBlock = buildCustomInstructionsBlock(
      user?.role ?? undefined,
      user?.customInstructions ?? undefined,
    );

    // Normalize legacy "ask"/"execute" to "edit"
    const effectiveMode: "edit" | "plan" =
      args.mode === "plan" ? "plan" : "edit";

    const branchName = session.branchName || `eva/session-${args.sessionId}`;

    const { resolvedMessage, prefixBlock } = await resolveDocMentions(
      ctx,
      args.message,
      session.repoId,
    );

    let prompt: string;
    if (effectiveMode === "plan") {
      prompt = buildPlanPrompt(
        { owner: repo.owner, name: repo.name },
        session.planContent || "",
        resolvedMessage,
        args.responseLength,
        rootDirectory,
        customInstructionsBlock,
        repo.systemPrompt,
      );
    } else {
      prompt = buildEditPrompt(
        { owner: repo.owner, name: repo.name },
        branchName,
        session.planContent || "",
        resolvedMessage,
        args.responseLength,
        rootDirectory,
        customInstructionsBlock,
        repo.systemPrompt,
      );
    }
    if (prefixBlock) {
      prompt = `${prefixBlock}\n\n${prompt}`;
    }

    return {
      sandboxId: session.sandboxId,
      repoOwner: repo.owner,
      repoName: repo.name,
      repoId: session.repoId,
      prompt,
      branchName,
      baseBranch: repo.defaultBaseBranch ?? FALLBACK_GIT_BASE_BRANCH,
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

    await sendCompletionEvent(
      ctx,
      sessionCompleteEvent,
      session.activeWorkflowId,
      {
        success: args.success,
        result: args.result,
        error: args.error,
        activityLog: args.activityLog,
        pendingQuestion: args.pendingQuestion,
      },
    );

    await recordCompletionLog(ctx, {
      entityType: "session",
      entityId: String(args.sessionId),
      entityTitle: session.title,
      repoId: session.repoId,
      rawResultEvent: args.rawResultEvent,
    });

    console.log(
      `[sessionWorkflow] handleCompletion finished in ${Date.now() - completionStartedAt}ms sessionId=${args.sessionId}`,
    );

    return null;
  },
});
