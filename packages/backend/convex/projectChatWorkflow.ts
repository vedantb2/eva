import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { defineEvent } from "@convex-dev/workflow";
import { workflow, cancelTrackedWorkflow } from "./workflowManager";
import { ensureSandboxStartedSteps } from "./_sandbox_runtime/resumeSandboxSteps";
import { authMutation, hasRepoAccess } from "./functions";
import {
  aiModelValidator,
  reasoningLevelValidator,
  workflowCompleteValidator,
  normalizeAIModel,
  roleValidator,
  taskSandboxStatusValidator,
  getAIModelProvider,
} from "./validators";
import {
  recordCompletionLog,
  sendCompletionEvent,
  clearStreamingActivity,
} from "./_taskWorkflow/helpers";
import { finalizeCancelledAssistantMessage } from "./streaming";
import { startNextQueuedProjectChatMessage } from "./_queues/helpers";
import {
  trackProjectChatWorkflow,
  PROJECT_CHAT_STREAM_PREFIX,
} from "./workflowWatchdog";
import { buildProjectChatPrompt } from "./_projects/chatPrompt";
import {
  buildProjectBranchName,
  getProjectGeneratedSpec,
} from "./_projects/helpers";
import { buildCustomInstructionsBlock } from "./prompts";
import { resolveMessageTokens } from "./_mentions/resolveMessageTokens";
import { notifyChatMentions } from "./_mentions/notifyChatMentions";
import { resolveCredentialSourceLabel } from "./_userProviderAccounts/credentialSource";
import type { Doc, Id } from "./_generated/dataModel";
import { PROJECT_CHAT_DAEMON_MUTATIONS } from "./_sandbox_runtime/daemonPaths";

async function finalizeOpenSyntheticTurnOnCancel(
  ctx: MutationCtx,
  syntheticTurnMessageId: Id<"messages"> | undefined,
  streaming: Doc<"streamingActivity"> | null,
): Promise<void> {
  if (syntheticTurnMessageId === undefined) return;
  const syntheticMessage = await ctx.db.get(syntheticTurnMessageId);
  if (syntheticMessage && syntheticMessage.finishedAt === undefined) {
    await finalizeCancelledAssistantMessage(ctx, syntheticMessage, streaming);
  }
}

const CHAT_ALLOWED_TOOLS = "Read,Write,Edit,Bash,Glob,Grep";

async function buildProjectChatTurnPrompt(
  ctx: QueryCtx,
  args: {
    projectId: Id<"projects">;
    message: string;
    userId: Id<"users">;
  },
): Promise<{
  prompt: string;
  attachmentStorageIds: Id<"_storage">[] | undefined;
}> {
  const project = await ctx.db.get(args.projectId);
  if (!project) throw new Error("Project not found");

  const repo = await ctx.db.get(project.repoId);
  if (!repo) throw new Error("Repository not found");

  const triggeringUserMessage = await ctx.db
    .query("messages")
    .withIndex("by_parent", (q) => q.eq("parentId", args.projectId))
    .order("desc")
    .filter((q) => q.eq(q.field("role"), "user"))
    .first();

  const generatedSpec = await getProjectGeneratedSpec(ctx.db, args.projectId);
  const user = await ctx.db.get(args.userId);
  const customInstructionsBlock = buildCustomInstructionsBlock(
    user?.role ?? undefined,
    user?.customInstructions ?? undefined,
  );

  const { resolvedMessage, prefixBlock } = await resolveMessageTokens(
    ctx,
    args.message,
    project.repoId,
  );

  const branchName =
    project.branchName ??
    buildProjectBranchName(args.projectId, project.branchVersion);

  let prompt = buildProjectChatPrompt({
    repoOwner: repo.owner,
    repoName: repo.name,
    branchName,
    title: project.title,
    description: project.description,
    generatedSpec,
    message: resolvedMessage,
    rootDirectory: repo.rootDirectory ?? "",
    customInstructionsBlock,
    systemPrompt: repo.systemPrompt,
    devPort: project.devPort ?? repo.devPort,
  });
  if (prefixBlock) {
    prompt = `${prefixBlock}\n\n${prompt}`;
  }

  return {
    prompt,
    attachmentStorageIds: triggeringUserMessage?.attachmentStorageIds,
  };
}

/** Streaming-activity entity id for a project chat. */
function chatStreamEntityId(projectId: Id<"projects">): string {
  return `${PROJECT_CHAT_STREAM_PREFIX}${String(projectId)}`;
}

// --- Completion event ---

export const projectChatCompleteEvent = defineEvent({
  name: "projectChatComplete",
  validator: workflowCompleteValidator,
});

// --- Public mutations ---

/** Inserts a user chat message into the project conversation. */
export const addMessage = authMutation({
  args: {
    projectId: v.id("projects"),
    // Defaults to "user". "assistant" lets the client surface a failed send
    // as a visible error message (same contract as sessions.addMessage).
    role: v.optional(roleValidator),
    content: v.string(),
    attachmentStorageIds: v.optional(v.array(v.id("_storage"))),
    providerAccountId: v.optional(v.id("userProviderAccounts")),
    model: v.optional(aiModelValidator),
    reasoningLevel: v.optional(reasoningLevelValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    if (!(await hasRepoAccess(ctx.db, project.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    const role = args.role ?? "user";
    await ctx.db.insert("messages", {
      parentId: args.projectId,
      role,
      content: args.content,
      timestamp: Date.now(),
      userId: ctx.userId,
      attachmentStorageIds: args.attachmentStorageIds,
      ...(role === "user"
        ? {
            credentialSourceLabel: await resolveCredentialSourceLabel(
              ctx.db,
              project.providerAccountId,
              project.userId,
            ),
            model: args.model,
            reasoningLevel: args.reasoningLevel,
          }
        : {}),
    });
    await ctx.db.patch(args.projectId, { updatedAt: Date.now() });
    return null;
  },
});

/** Starts a project chat workflow on the project's existing sandbox. */
export const startExecute = authMutation({
  args: {
    projectId: v.id("projects"),
    message: v.string(),
    model: aiModelValidator,
    reasoningLevel: v.optional(reasoningLevelValidator),
    thinkingEnabled: v.optional(v.boolean()),
    use1mContext: v.optional(v.boolean()),
    fastMode: v.optional(v.boolean()),
    providerAccountId: v.optional(v.id("userProviderAccounts")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    if (!(await hasRepoAccess(ctx.db, project.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }

    void args.providerAccountId;

    await notifyChatMentions(ctx, {
      content: args.message,
      authorUserId: ctx.userId,
      surface: { kind: "project", project },
    });

    await ctx.db.insert("messages", {
      parentId: args.projectId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      activityLog: "",
    });

    const { prompt, attachmentStorageIds } = await buildProjectChatTurnPrompt(
      ctx,
      {
        projectId: args.projectId,
        message: args.message,
        userId: ctx.userId,
      },
    );

    const normalizedModel = normalizeAIModel(args.model);
    const usesDaemonPull = getAIModelProvider(normalizedModel) === "claude";
    await ctx.db.patch(args.projectId, {
      ...(usesDaemonPull
        ? {
            pendingTurn: {
              prompt,
              requestedAt: Date.now(),
              attachmentStorageIds,
              model: normalizedModel,
            },
          }
        : { pendingTurn: undefined }),
      lastChatModel: normalizedModel,
      ...(args.reasoningLevel !== undefined
        ? { lastReasoningLevel: args.reasoningLevel }
        : {}),
      ...(args.thinkingEnabled !== undefined
        ? { lastThinkingEnabled: args.thinkingEnabled }
        : {}),
      ...(args.use1mContext !== undefined
        ? { lastUse1mContext: args.use1mContext }
        : {}),
      ...(args.fastMode !== undefined ? { lastFastMode: args.fastMode } : {}),
      updatedAt: Date.now(),
    });

    if (usesDaemonPull && project.sandboxId) {
      await ctx.scheduler.runAfter(0, internal.sandbox.prewarmEntityDaemon, {
        sandboxId: project.sandboxId,
        repoId: project.repoId,
        userId: ctx.userId,
        entityId: String(args.projectId),
        streamingEntityId: chatStreamEntityId(args.projectId),
        entityIdField: "projectId",
        completionMutation: "projectChatWorkflow:handleCompletion",
        ...PROJECT_CHAT_DAEMON_MUTATIONS,
        model: normalizedModel,
        reasoningLevel: args.reasoningLevel,
        thinkingEnabled: args.thinkingEnabled,
        use1mContext: args.use1mContext,
        fastMode: args.fastMode,
        allowedTools: CHAT_ALLOWED_TOOLS,
        providerAccountId: project.providerAccountId,
        credentialOwnerUserId: project.userId,
        sessionPersistenceId: args.projectId,
        activeWorkflowField: "activeChatWorkflowId",
        skipPrewarm: false,
        entityTable: "projects",
      });
    }

    const workflowId = await workflow.start(
      ctx,
      internal.projectChatWorkflow.projectChatExecuteWorkflow,
      {
        projectId: args.projectId,
        message: args.message,
        model: args.model,
        reasoningLevel: args.reasoningLevel,
        thinkingEnabled: args.thinkingEnabled,
        use1mContext: args.use1mContext,
        fastMode: args.fastMode,
        providerAccountId: project.providerAccountId,
        credentialOwnerUserId: project.userId,
        userId: ctx.userId,
      },
    );

    await trackProjectChatWorkflow(ctx, args.projectId, workflowId);

    return null;
  },
});

/** Queues a chat message to run after the current workflow finishes. */
export const enqueueMessage = authMutation({
  args: {
    projectId: v.id("projects"),
    message: v.string(),
    model: aiModelValidator,
    reasoningLevel: v.optional(reasoningLevelValidator),
    thinkingEnabled: v.optional(v.boolean()),
    use1mContext: v.optional(v.boolean()),
    fastMode: v.optional(v.boolean()),
    providerAccountId: v.optional(v.id("userProviderAccounts")),
    attachmentStorageIds: v.optional(v.array(v.id("_storage"))),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const content = args.message.trim();
    if (!content) return null;

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    if (!(await hasRepoAccess(ctx.db, project.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }

    await notifyChatMentions(ctx, {
      content,
      authorUserId: ctx.userId,
      surface: { kind: "project", project },
    });

    await ctx.db.insert("queuedMessages", {
      parentId: args.projectId,
      content,
      createdAt: Date.now(),
      order: Date.now(),
      userId: ctx.userId,
      model: args.model,
      reasoningLevel: args.reasoningLevel,
      thinkingEnabled: args.thinkingEnabled,
      use1mContext: args.use1mContext,
      fastMode: args.fastMode,
      providerAccountId: project.providerAccountId,
      attachmentStorageIds: args.attachmentStorageIds,
    });
    await ctx.db.patch(args.projectId, {
      lastChatModel: normalizeAIModel(args.model),
      ...(args.reasoningLevel !== undefined
        ? { lastReasoningLevel: args.reasoningLevel }
        : {}),
      ...(args.thinkingEnabled !== undefined
        ? { lastThinkingEnabled: args.thinkingEnabled }
        : {}),
      ...(args.use1mContext !== undefined
        ? { lastUse1mContext: args.use1mContext }
        : {}),
      ...(args.fastMode !== undefined ? { lastFastMode: args.fastMode } : {}),
      updatedAt: Date.now(),
    });
    return null;
  },
});

/**
 * Cancels the active project chat workflow and starts any queued message. For
 * a Claude daemon turn, sets `cancelRequestedAt` so the warm daemon interrupts
 * its own in-flight SDK query on its next `claimPendingTurn` poll, instead of
 * killing the sandbox process — Cursor/Codex/Opencode have no daemon to
 * observe the flag, so they keep the pkill-style kill.
 */
export const cancelExecution = authMutation({
  args: {
    projectId: v.id("projects"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    if (!(await hasRepoAccess(ctx.db, project.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }

    await cancelTrackedWorkflow(ctx, project.activeChatWorkflowId);

    const workflowIdToCancel = project.activeChatWorkflowId;
    const pendingRequestedAt = project.pendingTurn?.requestedAt;

    if (
      getAIModelProvider(
        normalizeAIModel(project.lastChatModel ?? project.model),
      ) === "claude"
    ) {
      await ctx.db.patch(args.projectId, { cancelRequestedAt: Date.now() });
    } else if (project.sandboxId) {
      if (project.activeWorkflowId || project.activeBuildWorkflowId) {
        await ctx.scheduler.runAfter(0, internal.sandbox.killEntityDaemon, {
          sandboxId: project.sandboxId,
          repoId: project.repoId,
          entityIdField: "projectId",
          entityId: String(args.projectId),
        });
      } else {
        await ctx.scheduler.runAfter(0, internal.sandbox.killSandboxProcess, {
          sandboxId: project.sandboxId,
          repoId: project.repoId,
        });
      }
    }

    const streamingEntityId = chatStreamEntityId(args.projectId);
    const streaming = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", streamingEntityId))
      .first();

    const latest = await ctx.db.get(args.projectId);
    if (!latest) return null;

    const newerTurnStaged =
      latest.pendingTurn !== undefined &&
      latest.pendingTurn.requestedAt !== pendingRequestedAt;
    const newerWorkflowTracked =
      latest.activeChatWorkflowId !== undefined &&
      latest.activeChatWorkflowId !== workflowIdToCancel;

    if (!newerTurnStaged && !newerWorkflowTracked) {
      const syntheticTurnMessageId = latest.syntheticTurnMessageId;
      const last = await ctx.db
        .query("messages")
        .withIndex("by_parent", (q) => q.eq("parentId", args.projectId))
        .order("desc")
        .first();
      if (
        last &&
        last.role === "assistant" &&
        last.finishedAt === undefined &&
        last._id !== syntheticTurnMessageId
      ) {
        await finalizeCancelledAssistantMessage(ctx, last, streaming);
      }
      await finalizeOpenSyntheticTurnOnCancel(
        ctx,
        syntheticTurnMessageId,
        streaming,
      );
    }

    await clearStreamingActivity(ctx, streamingEntityId);

    const projectPatch: {
      activeChatWorkflowId?: undefined;
      pendingTurn?: undefined;
      syntheticTurnMessageId?: undefined;
      updatedAt: number;
    } = { updatedAt: Date.now() };

    if (
      workflowIdToCancel !== undefined &&
      latest.activeChatWorkflowId === workflowIdToCancel
    ) {
      projectPatch.activeChatWorkflowId = undefined;
    }
    if (
      pendingRequestedAt !== undefined &&
      latest.pendingTurn?.requestedAt === pendingRequestedAt
    ) {
      projectPatch.pendingTurn = undefined;
    }
    if (!newerTurnStaged && !newerWorkflowTracked) {
      projectPatch.syntheticTurnMessageId = undefined;
    }

    await ctx.db.patch(args.projectId, projectPatch);

    await startNextQueuedProjectChatMessage(ctx, args.projectId);
    return null;
  },
});

// --- Workflow definition ---

/** Runs a single chat message through the project's existing sandbox agent. */
export const projectChatExecuteWorkflow = workflow.define({
  args: {
    projectId: v.id("projects"),
    message: v.string(),
    model: aiModelValidator,
    reasoningLevel: v.optional(reasoningLevelValidator),
    thinkingEnabled: v.optional(v.boolean()),
    use1mContext: v.optional(v.boolean()),
    fastMode: v.optional(v.boolean()),
    providerAccountId: v.optional(v.id("userProviderAccounts")),
    credentialOwnerUserId: v.optional(v.id("users")),
    userId: v.id("users"),
  },
  handler: async (step, args): Promise<void> => {
    const saveFailure = (error: string) =>
      step.runMutation(internal.projectChatWorkflow.saveResult, {
        projectId: args.projectId,
        success: false,
        result: null,
        error,
        activityLog: null,
      });

    await step.runMutation(
      internal.projectChatWorkflow.addAssistantPlaceholder,
      {
        projectId: args.projectId,
      },
    );

    const data = await step.runQuery(internal.projectChatWorkflow.getChatData, {
      projectId: args.projectId,
      message: args.message,
      model: args.model,
      userId: args.userId,
    });

    if (!data.sandboxId) {
      await saveFailure(
        "No active sandbox. Start the project sandbox before sending chat messages.",
      );
      return;
    }

    const streamingEntityId = chatStreamEntityId(args.projectId);

    // Bring an archived/stopped sandbox back to "started" via durable polling
    // steps before validating, so a multi-minute cold-storage thaw doesn't blow
    // the per-action 10-minute limit. Once started, validate hits its fast path.
    let started: Awaited<ReturnType<typeof ensureSandboxStartedSteps>>;
    try {
      started = await ensureSandboxStartedSteps(step, {
        sandboxId: data.sandboxId,
        repoId: data.repoId,
        streamingEntityId,
        sandboxRunning: data.sandboxStatus === "active",
      });
    } catch (error) {
      await saveFailure(
        error instanceof Error
          ? error.message
          : "Project sandbox could not be restored from cold storage. Please retry.",
      );
      return;
    }

    const activeSandboxId = started.thawId;
    if (!activeSandboxId) {
      await saveFailure(
        "No active sandbox. Start the project sandbox before sending chat messages.",
      );
      return;
    }

    const validation = await step.runAction(
      internal.sandbox.validateSandbox,
      { sandboxId: activeSandboxId, repoId: data.repoId },
      { retry: false },
    );

    if (!validation.healthy) {
      await saveFailure(
        "Project sandbox is no longer reachable. Restart it from the sandbox panel.",
      );
      return;
    }

    if (getAIModelProvider(data.model) === "claude") {
      await step.runMutation(internal.projectChatWorkflow.ensurePendingTurn, {
        projectId: args.projectId,
        prompt: data.prompt,
        attachmentStorageIds: data.attachmentStorageIds,
        model: args.model,
      });

      await step.runAction(internal.sandbox.prewarmEntityDaemon, {
        sandboxId: activeSandboxId,
        repoId: data.repoId,
        userId: args.userId,
        entityId: String(args.projectId),
        streamingEntityId,
        entityIdField: "projectId",
        completionMutation: "projectChatWorkflow:handleCompletion",
        ...PROJECT_CHAT_DAEMON_MUTATIONS,
        model: data.model,
        reasoningLevel: args.reasoningLevel,
        thinkingEnabled: args.thinkingEnabled,
        use1mContext: args.use1mContext,
        fastMode: args.fastMode,
        allowedTools: CHAT_ALLOWED_TOOLS,
        providerAccountId: args.providerAccountId,
        credentialOwnerUserId: args.credentialOwnerUserId,
        sessionPersistenceId: args.projectId,
        activeWorkflowField: "activeChatWorkflowId",
        skipPrewarm: false,
        entityTable: "projects",
      });
    } else {
      await step.runAction(internal.sandbox.launchOnExistingSandbox, {
        sandboxId: activeSandboxId,
        entityId: args.projectId,
        prompt: data.prompt,
        userId: args.userId,
        completionMutation: "projectChatWorkflow:handleCompletion",
        entityIdField: "projectId",
        model: data.model,
        reasoningLevel: args.reasoningLevel,
        thinkingEnabled: args.thinkingEnabled,
        use1mContext: args.use1mContext,
        fastMode: args.fastMode,
        providerAccountId: args.providerAccountId,
        credentialOwnerUserId: args.credentialOwnerUserId,
        allowedTools: CHAT_ALLOWED_TOOLS,
        repoId: data.repoId,
        sessionPersistenceId: args.projectId,
        streamingEntityId,
        attachmentStorageIds: data.attachmentStorageIds,
      });
    }

    const result = await step.awaitEvent(projectChatCompleteEvent);

    let savedSuccess = result.success;
    let savedError = result.error;

    if (result.success && activeSandboxId && data.branchName) {
      try {
        await step.runAction(internal.sandbox.pushSandboxBranch, {
          sandboxId: activeSandboxId,
          installationId: data.installationId,
          repoOwner: data.repoOwner,
          repoName: data.repoName,
          repoId: data.repoId,
          branchName: data.branchName,
        });
      } catch (error) {
        savedSuccess = false;
        savedError = `Chat completed locally, but Eva could not publish the branch to GitHub. The sandbox was preserved for recovery. ${error instanceof Error ? error.message : String(error)}`;
        console.error(
          `[projectChatWorkflow] pushSandboxBranch failed projectId=${String(args.projectId)}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    await step.runMutation(internal.projectChatWorkflow.saveResult, {
      projectId: args.projectId,
      success: savedSuccess,
      result: result.result,
      error: savedError,
      activityLog: result.activityLog,
      pendingQuestion: result.pendingQuestion,
    });
  },
});

// --- Supporting internal functions ---

/** Inserts an empty assistant message into the project chat for streaming updates. */
export const addAssistantPlaceholder = internalMutation({
  args: { projectId: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    const recent = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.projectId))
      .order("desc")
      .take(5);
    const lastTurnMessage = recent[0];
    if (
      lastTurnMessage &&
      lastTurnMessage.role === "assistant" &&
      lastTurnMessage.content === "" &&
      lastTurnMessage.finishedAt === undefined &&
      lastTurnMessage.isSyntheticTurn !== true
    ) {
      return null;
    }

    await ctx.db.insert("messages", {
      parentId: args.projectId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      activityLog: "",
    });
    await ctx.db.patch(args.projectId, { updatedAt: Date.now() });
    return null;
  },
});

/** Fetches project + repo data and builds the chat prompt. */
export const getChatData = internalQuery({
  args: {
    projectId: v.id("projects"),
    message: v.string(),
    model: aiModelValidator,
    userId: v.id("users"),
  },
  returns: v.object({
    sandboxId: v.optional(v.string()),
    sandboxStatus: v.optional(taskSandboxStatusValidator),
    repoOwner: v.string(),
    repoName: v.string(),
    repoId: v.id("githubRepos"),
    installationId: v.number(),
    branchName: v.string(),
    prompt: v.string(),
    model: aiModelValidator,
    attachmentStorageIds: v.optional(v.array(v.id("_storage"))),
  }),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    const repo = await ctx.db.get(project.repoId);
    if (!repo) throw new Error("Repository not found");

    const { prompt, attachmentStorageIds } = await buildProjectChatTurnPrompt(
      ctx,
      {
        projectId: args.projectId,
        message: args.message,
        userId: args.userId,
      },
    );

    const branchName =
      project.branchName ??
      buildProjectBranchName(args.projectId, project.branchVersion);

    return {
      sandboxId: project.sandboxId,
      sandboxStatus: project.reviewProjectSandboxStatus,
      repoOwner: repo.owner,
      repoName: repo.name,
      repoId: project.repoId,
      installationId: repo.installationId,
      branchName,
      prompt,
      model: normalizeAIModel(args.model),
      attachmentStorageIds,
    };
  },
});

/** Saves the chat result, finalising the last assistant message and starting the next queued message. */
export const saveResult = internalMutation({
  args: {
    projectId: v.id("projects"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
    pendingQuestion: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const streamingEntityId = chatStreamEntityId(args.projectId);
    await clearStreamingActivity(ctx, streamingEntityId);

    const project = await ctx.db.get(args.projectId);
    if (!project) return null;

    const last = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.projectId))
      .order("desc")
      .first();
    if (last && last.role === "assistant" && last.isSyntheticTurn !== true) {
      const patch: {
        content: string;
        activityLog?: string;
        finishedAt: number;
        pendingQuestion?: string;
      } = {
        content: args.success
          ? args.result || "I couldn't process your message."
          : `Error: ${args.error || "Unknown error during execution."}`,
        finishedAt: Date.now(),
      };
      if (args.activityLog) patch.activityLog = args.activityLog;
      if (args.pendingQuestion) patch.pendingQuestion = args.pendingQuestion;
      await ctx.db.patch(last._id, patch);
    }

    await ctx.db.patch(args.projectId, {
      activeChatWorkflowId: undefined,
      updatedAt: Date.now(),
      lastSandboxActivity: Date.now(),
    });

    await startNextQueuedProjectChatMessage(ctx, args.projectId);
    return null;
  },
});

/** Receives sandbox completion callback and forwards the event to the active chat workflow. */
export const handleCompletion = authMutation({
  args: {
    projectId: v.id("projects"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
    rawResultEvent: v.optional(v.string()),
    pendingQuestion: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project || !project.activeChatWorkflowId) return null;
    if (!(await hasRepoAccess(ctx.db, project.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }

    if (project.pendingTurn !== undefined) {
      await ctx.db.patch(args.projectId, { pendingTurn: undefined });
    }

    await sendCompletionEvent(
      ctx,
      projectChatCompleteEvent,
      project.activeChatWorkflowId,
      {
        success: args.success,
        result: args.result,
        error: args.error,
        activityLog: args.activityLog,
        pendingQuestion: args.pendingQuestion,
      },
    );

    await recordCompletionLog(ctx, {
      entityType: "project-chat",
      entityId: String(args.projectId),
      entityTitle: project.title,
      repoId: project.repoId,
      rawResultEvent: args.rawResultEvent,
      projectId: args.projectId,
    });

    return null;
  },
});

/** Fired when the project sandbox chat view opens to warm the chat daemon. */
export const prewarmChatDaemon = authMutation({
  args: { projectId: v.id("projects") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project?.sandboxId) return null;
    // Never prewarm a stopped/stopping sandbox. prewarmEntityDaemon execs on
    // the sandbox, and on Vercel any exec lazily resumes a stopped VM —
    // resurrecting a sandbox the user stopped, invisibly (same guard as
    // sessions' prewarmDaemon).
    if (
      project.reviewProjectSandboxStatus === "closed" ||
      project.reviewProjectSandboxStatus === "stopping"
    ) {
      return null;
    }
    if (!(await hasRepoAccess(ctx.db, project.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    await ctx.scheduler.runAfter(0, internal.sandbox.prewarmEntityDaemon, {
      sandboxId: project.sandboxId,
      repoId: project.repoId,
      userId: project.userId,
      entityId: String(args.projectId),
      streamingEntityId: chatStreamEntityId(args.projectId),
      entityIdField: "projectId",
      completionMutation: "projectChatWorkflow:handleCompletion",
      ...PROJECT_CHAT_DAEMON_MUTATIONS,
      model: normalizeAIModel(project.lastChatModel ?? project.model),
      // Forward the sticky traits so the prewarm's opts sig matches the turn
      // path — omitting them makes every page-open prewarm mismatch a
      // trait-launched daemon and kill+respawn it (see sessions' prewarmDaemon).
      reasoningLevel: project.lastReasoningLevel,
      thinkingEnabled: project.lastThinkingEnabled,
      use1mContext: project.lastUse1mContext,
      fastMode: project.lastFastMode,
      allowedTools: CHAT_ALLOWED_TOOLS,
      providerAccountId: project.providerAccountId,
      credentialOwnerUserId: project.userId,
      sessionPersistenceId: args.projectId,
      activeWorkflowField: "activeChatWorkflowId",
      skipPrewarm: false,
      entityTable: "projects",
    });
    return null;
  },
});

export {
  claimPendingTurn,
  completeSyntheticTurn,
  ensurePendingTurn,
  handleStaleSyntheticTurn,
  openSyntheticTurn,
  requestStopBackgroundAgent,
  updateBackgroundAgents,
} from "./_chat/projectChatDaemon";
