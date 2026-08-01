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
  taskSandboxStatusValidator,
  cursorTransportValidator,
} from "./validators";
import {
  recordCompletionLog,
  sendCompletionEvent,
  clearStreamingActivity,
} from "./_taskWorkflow/helpers";
import {
  clearStreamingActivityForTurn,
  finalizeCancelledAssistantMessage,
} from "./streaming";
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
import { resolveCredentialSourceLabel } from "./_userProviderAccounts/credentialSource";
import type { Doc, Id } from "./_generated/dataModel";
import { PROJECT_CHAT_DAEMON_MUTATIONS } from "./_sandbox_runtime/daemonPaths";
import { clearPendingQuestionsForTurn } from "./pendingQuestions";
import { usesChatDaemon } from "./_chat/daemonTransport";
import { optionalChatTurnIdentityFields } from "./_validators/tableFields";
import {
  cancellationTurnIdentity,
  callbackMatchesActiveTurn,
  exactTurnIdentity,
  turnIdentityMatches,
} from "./_chat/turnIdentity";
import {
  enqueueAcceptedTurn,
  findExistingTurn,
  insertAcceptedTurnMessages,
  turnRequestFingerprint,
  validateClientTurnId,
} from "./_chat/turnLifecycle";

const submitTurnResultValidator = v.object({
  kind: v.union(
    v.literal("active"),
    v.literal("queued"),
    v.literal("existing"),
  ),
  turnId: v.string(),
  userMessageId: v.optional(v.id("messages")),
  assistantMessageId: v.optional(v.id("messages")),
  queuedMessageId: v.optional(v.id("queuedMessages")),
});

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
    captureProof: project.chatCaptureProofEnabled === true,
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

/** Atomically accepts one project chat turn and chooses active or queued. */
export const submitTurn = authMutation({
  args: {
    projectId: v.id("projects"),
    turnId: v.string(),
    message: v.string(),
    model: aiModelValidator,
    reasoningLevel: v.optional(reasoningLevelValidator),
    thinkingEnabled: v.optional(v.boolean()),
    use1mContext: v.optional(v.boolean()),
    providerAccountId: v.optional(v.id("userProviderAccounts")),
    attachmentStorageIds: v.optional(v.array(v.id("_storage"))),
  },
  returns: submitTurnResultValidator,
  handler: async (
    ctx,
    args,
  ): Promise<typeof submitTurnResultValidator.type> => {
    validateClientTurnId(args.turnId);
    const content = args.message.trim();
    if (content.length === 0) throw new Error("Message cannot be empty");
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    if (!(await hasRepoAccess(ctx.db, project.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }

    void args.providerAccountId;
    const normalizedModel = normalizeAIModel(args.model);
    const snapshot = {
      content,
      model: normalizedModel,
      reasoningLevel: args.reasoningLevel,
      thinkingEnabled: args.thinkingEnabled,
      use1mContext: args.use1mContext,
      providerAccountId: project.providerAccountId,
      attachmentStorageIds: args.attachmentStorageIds,
    };
    const fingerprint = turnRequestFingerprint(snapshot);
    const existing = await findExistingTurn(
      ctx,
      args.projectId,
      args.turnId,
      fingerprint,
    );
    if (existing !== null) {
      return {
        kind: "existing",
        turnId: args.turnId,
        ...(existing.kind === "queued"
          ? { queuedMessageId: existing.queuedMessageId }
          : {
              userMessageId: existing.userMessageId,
              assistantMessageId: existing.assistantMessageId,
            }),
      };
    }

    const busy =
      project.activeTurn !== undefined ||
      project.activeChatWorkflowId !== undefined ||
      project.pendingTurn !== undefined;
    if (busy) {
      const queuedMessageId = await enqueueAcceptedTurn(ctx, {
        parentId: args.projectId,
        turnId: args.turnId,
        fingerprint,
        userId: ctx.userId,
        snapshot,
      });
      await ctx.db.patch(args.projectId, {
        lastChatModel: normalizedModel,
        lastReasoningLevel: args.reasoningLevel,
        lastThinkingEnabled: args.thinkingEnabled,
        lastUse1mContext: args.use1mContext,
        updatedAt: Date.now(),
        lastSandboxActivity: Date.now(),
      });
      return { kind: "queued", turnId: args.turnId, queuedMessageId };
    }

    const ids = await insertAcceptedTurnMessages(ctx, {
      parentId: args.projectId,
      turnId: args.turnId,
      fingerprint,
      userId: ctx.userId,
      content,
      attachmentStorageIds: args.attachmentStorageIds,
      credentialSourceLabel: await resolveCredentialSourceLabel(
        ctx.db,
        project.providerAccountId,
        project.userId,
      ),
      model: normalizedModel,
      reasoningLevel: args.reasoningLevel,
    });
    const activeTurn = {
      turnId: args.turnId,
      assistantMessageId: ids.assistantMessageId,
      attempt: 1,
      acceptedAt: Date.now(),
    };
    await ctx.db.patch(args.projectId, {
      activeTurn,
      lastChatModel: normalizedModel,
      lastReasoningLevel: args.reasoningLevel,
      lastThinkingEnabled: args.thinkingEnabled,
      lastUse1mContext: args.use1mContext,
      updatedAt: Date.now(),
      lastSandboxActivity: Date.now(),
    });
    await clearStreamingActivity(
      ctx,
      `${PROJECT_CHAT_STREAM_PREFIX}${String(args.projectId)}`,
    );
    const workflowId = await workflow.start(
      ctx,
      internal.projectChatWorkflow.projectChatExecuteWorkflow,
      {
        projectId: args.projectId,
        message: content,
        model: normalizedModel,
        reasoningLevel: args.reasoningLevel,
        thinkingEnabled: args.thinkingEnabled,
        use1mContext: args.use1mContext,
        providerAccountId: project.providerAccountId,
        credentialOwnerUserId: project.userId,
        userId: ctx.userId,
        turnId: activeTurn.turnId,
        assistantMessageId: activeTurn.assistantMessageId,
        attempt: activeTurn.attempt,
      },
    );
    await trackProjectChatWorkflow(ctx, args.projectId, workflowId);
    return {
      kind: "active",
      turnId: args.turnId,
      userMessageId: ids.userMessageId,
      assistantMessageId: ids.assistantMessageId,
    };
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
    ...optionalChatTurnIdentityFields,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    if (!(await hasRepoAccess(ctx.db, project.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }

    const turnIdentity = cancellationTurnIdentity(project.activeTurn, args);
    if (project.activeTurn !== undefined) {
      if (turnIdentity === null) return null;
      await clearPendingQuestionsForTurn(
        ctx.db,
        String(args.projectId),
        turnIdentity,
      );
      await cancelTrackedWorkflow(ctx, project.activeChatWorkflowId);
      if (
        usesChatDaemon(
          project.lastChatModel ?? project.model,
          project.cursorTransport,
        )
      ) {
        await ctx.db.patch(args.projectId, { cancelRequestedAt: Date.now() });
      } else if (project.sandboxId) {
        await ctx.scheduler.runAfter(0, internal.sandbox.killSandboxProcess, {
          sandboxId: project.sandboxId,
          repoId: project.repoId,
        });
      }
      const streamingEntityId = chatStreamEntityId(args.projectId);
      const streaming = await ctx.db
        .query("streamingActivity")
        .withIndex("by_entity", (q) => q.eq("entityId", streamingEntityId))
        .first();
      const assistant = await ctx.db.get(turnIdentity.assistantMessageId);
      if (
        assistant !== null &&
        assistant.parentId === args.projectId &&
        assistant.turnId === turnIdentity.turnId &&
        assistant.finishedAt === undefined
      ) {
        await finalizeCancelledAssistantMessage(
          ctx,
          assistant,
          streaming !== null && turnIdentityMatches(streaming, turnIdentity)
            ? streaming
            : null,
        );
      }
      await clearStreamingActivityForTurn(ctx, streamingEntityId, turnIdentity);
      await ctx.db.patch(args.projectId, {
        activeTurn: undefined,
        activeChatWorkflowId: undefined,
        pendingTurn: undefined,
        syntheticTurnMessageId: undefined,
        updatedAt: Date.now(),
        lastSandboxActivity: Date.now(),
      });
      await startNextQueuedProjectChatMessage(ctx, args.projectId);
      return null;
    }

    await cancelTrackedWorkflow(ctx, project.activeChatWorkflowId);

    const workflowIdToCancel = project.activeChatWorkflowId;
    const pendingRequestedAt = project.pendingTurn?.requestedAt;

    if (
      usesChatDaemon(
        project.lastChatModel ?? project.model,
        project.cursorTransport,
      )
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
    providerAccountId: v.optional(v.id("userProviderAccounts")),
    credentialOwnerUserId: v.optional(v.id("users")),
    userId: v.id("users"),
    ...optionalChatTurnIdentityFields,
  },
  handler: async (step, args): Promise<void> => {
    const turnIdentity = exactTurnIdentity(args);
    const saveFailure = (error: string) =>
      step.runMutation(internal.projectChatWorkflow.saveResult, {
        projectId: args.projectId,
        success: false,
        result: null,
        error,
        activityLog: null,
        ...turnIdentity,
      });

    await step.runMutation(
      internal.projectChatWorkflow.addAssistantPlaceholder,
      {
        projectId: args.projectId,
        ...turnIdentity,
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

    if (usesChatDaemon(data.model, data.cursorTransport)) {
      await step.runMutation(internal.projectChatWorkflow.ensurePendingTurn, {
        projectId: args.projectId,
        prompt: data.prompt,
        attachmentStorageIds: data.attachmentStorageIds,
        model: args.model,
        ...turnIdentity,
      });

      await step.runAction(internal.sandbox.prewarmEntityDaemon, {
        sandboxId: activeSandboxId,
        repoId: data.repoId,
        userId: args.userId,
        entityId: String(args.projectId),
        entityIdField: "projectId",
        completionMutation: "projectChatWorkflow:handleCompletion",
        ...PROJECT_CHAT_DAEMON_MUTATIONS,
        model: data.model,
        cursorTransport: data.cursorTransport,
        reasoningLevel: args.reasoningLevel,
        thinkingEnabled: args.thinkingEnabled,
        use1mContext: args.use1mContext,
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
        providerAccountId: args.providerAccountId,
        credentialOwnerUserId: args.credentialOwnerUserId,
        allowedTools: CHAT_ALLOWED_TOOLS,
        repoId: data.repoId,
        sessionPersistenceId: args.projectId,
        streamingEntityId,
        attachmentStorageIds: data.attachmentStorageIds,
        turnIdentity: turnIdentity ?? undefined,
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
      ...turnIdentity,
    });

    // Fire a detached audit when the project has chat audit enabled. No-ops
    // when off / no sandbox / no categories / an audit is already running.
    if (savedSuccess) {
      try {
        await step.runMutation(internal.audits.maybeStartProjectChatAudit, {
          projectId: args.projectId,
          userId: args.userId,
        });
      } catch (error) {
        console.error(
          `[projectChatWorkflow] maybeStartProjectChatAudit failed projectId=${String(args.projectId)}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  },
});

// --- Supporting internal functions ---

/** Inserts an empty assistant message into the project chat for streaming updates. */
export const addAssistantPlaceholder = internalMutation({
  args: {
    projectId: v.id("projects"),
    ...optionalChatTurnIdentityFields,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    const turnIdentity = exactTurnIdentity(args);
    if (turnIdentity !== null) {
      const assistant = await ctx.db.get(turnIdentity.assistantMessageId);
      if (
        assistant === null ||
        assistant.parentId !== args.projectId ||
        assistant.turnId !== turnIdentity.turnId ||
        assistant.role !== "assistant"
      ) {
        throw new Error("Accepted project turn is missing its assistant row");
      }
      return null;
    }

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
    cursorTransport: v.optional(cursorTransportValidator),
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
      cursorTransport: project.cursorTransport,
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
    ...optionalChatTurnIdentityFields,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const streamingEntityId = chatStreamEntityId(args.projectId);
    const project = await ctx.db.get(args.projectId);
    if (!project) return null;
    const turnIdentity = exactTurnIdentity(args);
    let last: Doc<"messages"> | null;
    if (turnIdentity !== null) {
      if (!callbackMatchesActiveTurn(project, turnIdentity)) return null;
      await clearStreamingActivityForTurn(ctx, streamingEntityId, turnIdentity);
      last = await ctx.db.get(turnIdentity.assistantMessageId);
      if (
        last === null ||
        last.parentId !== args.projectId ||
        last.turnId !== turnIdentity.turnId
      ) {
        return null;
      }
    } else {
      await clearStreamingActivity(ctx, streamingEntityId);
      last = await ctx.db
        .query("messages")
        .withIndex("by_parent", (q) => q.eq("parentId", args.projectId))
        .order("desc")
        .first();
    }
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
      ...(turnIdentity !== null ? { activeTurn: undefined } : {}),
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
    ...optionalChatTurnIdentityFields,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project || !project.activeChatWorkflowId) return null;
    if (!(await hasRepoAccess(ctx.db, project.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    if (!callbackMatchesActiveTurn(project, args)) return null;
    const completionTurnIdentity = exactTurnIdentity(args);
    if (completionTurnIdentity !== null) {
      await clearPendingQuestionsForTurn(
        ctx.db,
        String(args.projectId),
        completionTurnIdentity,
      );
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
    if (!(await hasRepoAccess(ctx.db, project.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    await ctx.scheduler.runAfter(0, internal.sandbox.prewarmEntityDaemon, {
      sandboxId: project.sandboxId,
      repoId: project.repoId,
      userId: project.userId,
      entityId: String(args.projectId),
      entityIdField: "projectId",
      completionMutation: "projectChatWorkflow:handleCompletion",
      ...PROJECT_CHAT_DAEMON_MUTATIONS,
      model: normalizeAIModel(project.lastChatModel ?? project.model),
      cursorTransport: project.cursorTransport,
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
