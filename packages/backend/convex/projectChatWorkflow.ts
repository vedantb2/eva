import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { defineEvent } from "@convex-dev/workflow";
import { workflow, cancelTrackedWorkflow } from "./workflowManager";
import { authMutation, hasRepoAccess } from "./functions";
import {
  aiModelValidator,
  workflowCompleteValidator,
  normalizeAIModel,
} from "./validators";
import {
  recordCompletionLog,
  sendCompletionEvent,
  clearStreamingActivity,
} from "./_taskWorkflow/helpers";
import { startNextQueuedProjectChatMessage } from "./_queues/helpers";
import {
  trackProjectChatWorkflow,
  PROJECT_CHAT_STREAM_PREFIX,
} from "./workflowWatchdog";
import { buildProjectChatPrompt } from "./_projects/chatPrompt";
import { getProjectGeneratedSpec } from "./_projects/helpers";
import { buildCustomInstructionsBlock } from "./prompts";

// Tools available to chat — full read/write but Eva never commits/pushes
// from chat (see prompt). Mirrors session edit mode but without branch ops.
const CHAT_ALLOWED_TOOLS = "Read,Write,Edit,Bash,Glob,Grep";

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
    responseLength: v.string(),
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
        responseLength: args.responseLength,
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
    responseLength: v.string(),
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
      userId: ctx.userId,
      model: args.model,
      responseLength: args.responseLength,
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

    const streamingEntityId = `${PROJECT_CHAT_STREAM_PREFIX}${String(args.projectId)}`;
    const streaming = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", streamingEntityId))
      .first();

    const last = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.projectId))
      .order("desc")
      .first();
    if (last && last.role === "assistant") {
      const patch: {
        content?: string;
        activityLog?: string;
        finishedAt: number;
      } = { finishedAt: Date.now() };
      if (!last.content) patch.content = "Execution cancelled by user.";
      if (streaming?.currentActivity)
        patch.activityLog = streaming.currentActivity;
      await ctx.db.patch(last._id, patch);
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
    responseLength: v.string(),
    userId: v.id("users"),
  },
  handler: async (step, args): Promise<void> => {
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
      responseLength: args.responseLength,
      userId: args.userId,
    });

    if (!data.sandboxId) {
      await step.runMutation(internal.projectChatWorkflow.saveResult, {
        projectId: args.projectId,
        success: false,
        result: null,
        error:
          "No active sandbox. Start the project sandbox before sending chat messages.",
        activityLog: null,
      });
      return;
    }

    const validation = await step.runAction(
      internal.daytona.validateSandbox,
      { sandboxId: data.sandboxId, repoId: data.repoId },
      { retry: false },
    );

    if (!validation.healthy) {
      await step.runMutation(internal.projectChatWorkflow.saveResult, {
        projectId: args.projectId,
        success: false,
        result: null,
        error:
          "Project sandbox is no longer reachable. Restart it from the sandbox panel.",
        activityLog: null,
      });
      return;
    }

    const streamingEntityId = `${PROJECT_CHAT_STREAM_PREFIX}${String(args.projectId)}`;

    await step.runAction(internal.daytona.launchOnExistingSandbox, {
      sandboxId: data.sandboxId,
      entityId: args.projectId,
      prompt: data.prompt,
      userId: args.userId,
      completionMutation: "projectChatWorkflow:handleCompletion",
      entityIdField: "projectId",
      model: data.model,
      allowedTools: CHAT_ALLOWED_TOOLS,
      repoId: data.repoId,
      sessionPersistenceId: args.projectId,
      streamingEntityId,
    });

    const result = await step.awaitEvent(projectChatCompleteEvent);

    await step.runMutation(internal.projectChatWorkflow.saveResult, {
      projectId: args.projectId,
      success: result.success,
      result: result.result,
      error: result.error,
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
    model: aiModelValidator,
  }),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    const repo = await ctx.db.get(project.repoId);
    if (!repo) throw new Error("Repository not found");

    const generatedSpec = await getProjectGeneratedSpec(ctx.db, args.projectId);
    const user = await ctx.db.get(args.userId);
    const customInstructionsBlock = buildCustomInstructionsBlock(
      user?.role ?? undefined,
      user?.customInstructions ?? undefined,
    );

    const prompt = buildProjectChatPrompt({
      repoOwner: repo.owner,
      repoName: repo.name,
      title: project.title,
      description: project.description,
      branchName: project.branchName,
      generatedSpec,
      message: args.message,
      responseLength: args.responseLength,
      rootDirectory: repo.rootDirectory ?? "",
      customInstructionsBlock,
      systemPrompt: repo.systemPrompt,
    });

    return {
      sandboxId: project.sandboxId,
      repoOwner: repo.owner,
      repoName: repo.name,
      repoId: project.repoId,
      prompt,
      branchName: project.branchName,
      model: normalizeAIModel(args.model),
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
    const streamingEntityId = `${PROJECT_CHAT_STREAM_PREFIX}${String(args.projectId)}`;
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
    });

    return null;
  },
});
