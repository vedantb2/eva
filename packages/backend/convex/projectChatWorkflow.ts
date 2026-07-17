import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { defineEvent } from "@convex-dev/workflow";
import { workflow, cancelTrackedWorkflow } from "./workflowManager";
import { ensureSandboxStartedSteps } from "./_daytona/resumeSandboxSteps";
import { authMutation, hasRepoAccess } from "./functions";
import {
  aiModelValidator,
  reasoningLevelValidator,
  workflowCompleteValidator,
  normalizeAIModel,
  taskSandboxStatusValidator,
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
import { resolveCredentialSourceLabel } from "./_userProviderAccounts/credentialSource";

// Full read/write + Bash for local commits; Eva pushes after success.
const CHAT_ALLOWED_TOOLS = "Read,Write,Edit,Bash,Glob,Grep";

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
    content: v.string(),
    attachmentStorageIds: v.optional(v.array(v.id("_storage"))),
    providerAccountId: v.optional(v.id("userProviderAccounts")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    if (!(await hasRepoAccess(ctx.db, project.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }
    await ctx.db.insert("messages", {
      parentId: args.projectId,
      role: "user",
      content: args.content,
      timestamp: Date.now(),
      userId: ctx.userId,
      attachmentStorageIds: args.attachmentStorageIds,
      credentialSourceLabel: await resolveCredentialSourceLabel(
        ctx.db,
        args.providerAccountId,
        ctx.userId,
      ),
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
    providerAccountId: v.optional(v.id("userProviderAccounts")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");
    if (!(await hasRepoAccess(ctx.db, project.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }

    const workflowId = await workflow.start(
      ctx,
      internal.projectChatWorkflow.projectChatExecuteWorkflow,
      {
        projectId: args.projectId,
        message: args.message,
        model: args.model,
        reasoningLevel: args.reasoningLevel,
        providerAccountId: args.providerAccountId,
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

    await ctx.db.insert("queuedMessages", {
      parentId: args.projectId,
      content,
      createdAt: Date.now(),
      order: Date.now(),
      userId: ctx.userId,
      model: args.model,
      reasoningLevel: args.reasoningLevel,
      providerAccountId: args.providerAccountId,
      attachmentStorageIds: args.attachmentStorageIds,
    });
    await ctx.db.patch(args.projectId, { updatedAt: Date.now() });
    return null;
  },
});

/** Cancels the active project chat workflow and starts any queued message. */
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

    if (project.sandboxId) {
      await ctx.scheduler.runAfter(0, internal.daytona.killSandboxProcess, {
        sandboxId: project.sandboxId,
        repoId: project.repoId,
      });
    }

    const streamingEntityId = chatStreamEntityId(args.projectId);
    const streaming = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", streamingEntityId))
      .first();

    const last = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.projectId))
      .order("desc")
      .first();
    if (last && last.role === "assistant" && last.finishedAt === undefined) {
      await finalizeCancelledAssistantMessage(ctx, last, streaming);
    }

    await clearStreamingActivity(ctx, streamingEntityId);

    await ctx.db.patch(args.projectId, {
      activeChatWorkflowId: undefined,
      updatedAt: Date.now(),
    });

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
    providerAccountId: v.optional(v.id("userProviderAccounts")),
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

    if (!data.sandboxId && !data.vercelSandboxId) {
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
        vercelSandboxId: data.vercelSandboxId,
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
      internal.daytona.validateSandbox,
      { sandboxId: activeSandboxId, repoId: data.repoId },
      { retry: false },
    );

    if (!validation.healthy) {
      await saveFailure(
        "Project sandbox is no longer reachable. Restart it from the sandbox panel.",
      );
      return;
    }

    await step.runAction(internal.daytona.launchOnExistingSandbox, {
      sandboxId: activeSandboxId,
      entityId: args.projectId,
      prompt: data.prompt,
      userId: args.userId,
      completionMutation: "projectChatWorkflow:handleCompletion",
      entityIdField: "projectId",
      model: data.model,
      reasoningLevel: args.reasoningLevel,
      providerAccountId: args.providerAccountId,
      allowedTools: CHAT_ALLOWED_TOOLS,
      repoId: data.repoId,
      sessionPersistenceId: args.projectId,
      streamingEntityId,
      attachmentStorageIds: data.attachmentStorageIds,
    });

    const result = await step.awaitEvent(projectChatCompleteEvent);

    let savedSuccess = result.success;
    let savedError = result.error;

    if (result.success && activeSandboxId && data.branchName) {
      try {
        await step.runAction(internal.daytona.pushSandboxBranch, {
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
    vercelSandboxId: v.optional(v.string()),
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

    // Input images the composer attached to the triggering user message.
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
    });
    if (prefixBlock) {
      prompt = `${prefixBlock}\n\n${prompt}`;
    }

    return {
      sandboxId: project.sandboxId,
      vercelSandboxId: project.vercelSandboxId,
      sandboxStatus: project.reviewProjectSandboxStatus,
      repoOwner: repo.owner,
      repoName: repo.name,
      repoId: project.repoId,
      installationId: repo.installationId,
      branchName,
      prompt,
      model: normalizeAIModel(args.model),
      attachmentStorageIds: triggeringUserMessage?.attachmentStorageIds,
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
    if (last && last.role === "assistant") {
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
