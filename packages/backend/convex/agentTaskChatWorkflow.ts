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
import { startNextQueuedTaskChatMessage } from "./_queues/helpers";
import {
  trackAgentTaskChatWorkflow,
  TASK_CHAT_STREAM_PREFIX,
} from "./workflowWatchdog";
import { buildAgentTaskChatPrompt } from "./_agentTasks/chatPrompt";
import { resolveTaskBranchName } from "./_taskWorkflow/helpers";
import { buildCustomInstructionsBlock } from "./prompts";
import { resolveMessageTokens } from "./_mentions/resolveMessageTokens";

const CHAT_ALLOWED_TOOLS = "Read,Write,Edit,Bash,Glob,Grep";

// --- Completion event ---

export const agentTaskChatCompleteEvent = defineEvent({
  name: "agentTaskChatComplete",
  validator: workflowCompleteValidator,
});

// --- Public mutations ---

/** Inserts a user chat message into the task conversation. */
export const addMessage = authMutation({
  args: {
    taskId: v.id("agentTasks"),
    content: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    if (
      !task.repoId ||
      !(await hasRepoAccess(ctx.db, task.repoId, ctx.userId))
    ) {
      throw new Error("Not authorized");
    }
    await ctx.db.insert("messages", {
      parentId: args.taskId,
      role: "user",
      content: args.content,
      timestamp: Date.now(),
      userId: ctx.userId,
    });
    await ctx.db.patch(args.taskId, { updatedAt: Date.now() });
    return null;
  },
});

/** Starts a task chat workflow on the task's existing sandbox. */
export const startExecute = authMutation({
  args: {
    taskId: v.id("agentTasks"),
    message: v.string(),
    model: aiModelValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    if (
      !task.repoId ||
      !(await hasRepoAccess(ctx.db, task.repoId, ctx.userId))
    ) {
      throw new Error("Not authorized");
    }

    const workflowId = await workflow.start(
      ctx,
      internal.agentTaskChatWorkflow.agentTaskChatExecuteWorkflow,
      {
        taskId: args.taskId,
        message: args.message,
        model: args.model,
        userId: ctx.userId,
      },
    );

    await trackAgentTaskChatWorkflow(ctx, args.taskId, workflowId);
    return null;
  },
});

/** Queues a chat message to run after the current workflow finishes. */
export const enqueueMessage = authMutation({
  args: {
    taskId: v.id("agentTasks"),
    message: v.string(),
    model: aiModelValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const content = args.message.trim();
    if (!content) return null;

    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    if (
      !task.repoId ||
      !(await hasRepoAccess(ctx.db, task.repoId, ctx.userId))
    ) {
      throw new Error("Not authorized");
    }

    await ctx.db.insert("queuedMessages", {
      parentId: args.taskId,
      content,
      createdAt: Date.now(),
      userId: ctx.userId,
      model: args.model,
    });
    await ctx.db.patch(args.taskId, { updatedAt: Date.now() });
    return null;
  },
});

/** Cancels the active task chat workflow and starts any queued message. */
export const cancelExecution = authMutation({
  args: {
    taskId: v.id("agentTasks"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    if (
      !task.repoId ||
      !(await hasRepoAccess(ctx.db, task.repoId, ctx.userId))
    ) {
      throw new Error("Not authorized");
    }

    await cancelTrackedWorkflow(ctx, task.activeChatWorkflowId);

    if (task.sandboxId) {
      await ctx.scheduler.runAfter(0, internal.daytona.killSandboxProcess, {
        sandboxId: task.sandboxId,
        repoId: task.repoId,
      });
    }

    const streamingEntityId = `${TASK_CHAT_STREAM_PREFIX}${String(args.taskId)}`;
    const streaming = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", streamingEntityId))
      .first();

    const last = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.taskId))
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

    await ctx.db.patch(args.taskId, {
      activeChatWorkflowId: undefined,
      updatedAt: Date.now(),
    });

    await startNextQueuedTaskChatMessage(ctx, args.taskId);
    return null;
  },
});

// --- Workflow definition ---

/** Runs a single chat message through the task's existing sandbox agent. */
export const agentTaskChatExecuteWorkflow = workflow.define({
  args: {
    taskId: v.id("agentTasks"),
    message: v.string(),
    model: aiModelValidator,
    userId: v.id("users"),
  },
  handler: async (step, args): Promise<void> => {
    await step.runMutation(
      internal.agentTaskChatWorkflow.addAssistantPlaceholder,
      { taskId: args.taskId },
    );

    const data = await step.runQuery(
      internal.agentTaskChatWorkflow.getChatData,
      {
        taskId: args.taskId,
        message: args.message,
        model: args.model,
        userId: args.userId,
      },
    );

    if (!data.sandboxId) {
      await step.runMutation(internal.agentTaskChatWorkflow.saveResult, {
        taskId: args.taskId,
        success: false,
        result: null,
        error:
          "No active sandbox. Start the task sandbox before sending chat messages.",
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
      await step.runMutation(internal.agentTaskChatWorkflow.saveResult, {
        taskId: args.taskId,
        success: false,
        result: null,
        error:
          "Task sandbox is no longer reachable. Restart it from the sandbox panel.",
        activityLog: null,
      });
      return;
    }

    const streamingEntityId = `${TASK_CHAT_STREAM_PREFIX}${String(args.taskId)}`;

    await step.runAction(internal.daytona.launchOnExistingSandbox, {
      sandboxId: data.sandboxId,
      entityId: args.taskId,
      prompt: data.prompt,
      userId: args.userId,
      completionMutation: "agentTaskChatWorkflow:handleCompletion",
      entityIdField: "taskId",
      model: data.model,
      allowedTools: CHAT_ALLOWED_TOOLS,
      repoId: data.repoId,
      sessionPersistenceId: args.taskId,
      streamingEntityId,
    });

    const result = await step.awaitEvent(agentTaskChatCompleteEvent);

    let savedSuccess = result.success;
    let savedError = result.error;

    if (result.success && data.sandboxId && data.branchName) {
      try {
        await step.runAction(internal.daytona.pushSandboxBranch, {
          sandboxId: data.sandboxId,
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
          `[agentTaskChatWorkflow] pushSandboxBranch failed taskId=${String(args.taskId)}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    await step.runMutation(internal.agentTaskChatWorkflow.saveResult, {
      taskId: args.taskId,
      success: savedSuccess,
      result: result.result,
      error: savedError,
      activityLog: result.activityLog,
      pendingQuestion: result.pendingQuestion,
    });
  },
});

// --- Supporting internal functions ---

/** Inserts an empty assistant message into the task chat for streaming updates. */
export const addAssistantPlaceholder = internalMutation({
  args: { taskId: v.id("agentTasks") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    await ctx.db.insert("messages", {
      parentId: args.taskId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
      activityLog: "",
    });
    await ctx.db.patch(args.taskId, { updatedAt: Date.now() });
    return null;
  },
});

/** Fetches task + repo data and builds the chat prompt. */
export const getChatData = internalQuery({
  args: {
    taskId: v.id("agentTasks"),
    message: v.string(),
    model: aiModelValidator,
    userId: v.id("users"),
  },
  returns: v.object({
    sandboxId: v.optional(v.string()),
    repoOwner: v.string(),
    repoName: v.string(),
    repoId: v.id("githubRepos"),
    installationId: v.number(),
    branchName: v.string(),
    prompt: v.string(),
    model: aiModelValidator,
  }),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    if (!task.repoId) throw new Error("Task is not associated with a repo");

    const repo = await ctx.db.get(task.repoId);
    if (!repo) throw new Error("Repository not found");

    const user = await ctx.db.get(args.userId);
    const customInstructionsBlock = buildCustomInstructionsBlock(
      user?.role ?? undefined,
      user?.customInstructions ?? undefined,
    );

    const { resolvedMessage, prefixBlock } = await resolveMessageTokens(
      ctx,
      args.message,
      task.repoId,
    );

    const branchName = await resolveTaskBranchName(ctx.db, task);

    let prompt = buildAgentTaskChatPrompt({
      repoOwner: repo.owner,
      repoName: repo.name,
      branchName,
      title: task.title,
      description: task.description,
      tags: task.tags,
      taskNumber: task.taskNumber,
      status: task.status,
      message: resolvedMessage,
      rootDirectory: repo.rootDirectory ?? "",
      customInstructionsBlock,
      systemPrompt: repo.systemPrompt,
    });
    if (prefixBlock) {
      prompt = `${prefixBlock}\n\n${prompt}`;
    }

    return {
      sandboxId: task.sandboxId,
      repoOwner: repo.owner,
      repoName: repo.name,
      repoId: task.repoId,
      installationId: repo.installationId,
      branchName,
      prompt,
      model: normalizeAIModel(args.model),
    };
  },
});

/** Saves the chat result, finalising the last assistant message and starting the next queued message. */
export const saveResult = internalMutation({
  args: {
    taskId: v.id("agentTasks"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
    pendingQuestion: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const streamingEntityId = `${TASK_CHAT_STREAM_PREFIX}${String(args.taskId)}`;
    await clearStreamingActivity(ctx, streamingEntityId);

    const task = await ctx.db.get(args.taskId);
    if (!task) return null;

    const last = await ctx.db
      .query("messages")
      .withIndex("by_parent", (q) => q.eq("parentId", args.taskId))
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

    await ctx.db.patch(args.taskId, {
      activeChatWorkflowId: undefined,
      updatedAt: Date.now(),
    });

    await startNextQueuedTaskChatMessage(ctx, args.taskId);
    return null;
  },
});

/** Receives sandbox completion callback and forwards the event to the active chat workflow. */
export const handleCompletion = authMutation({
  args: {
    taskId: v.id("agentTasks"),
    success: v.boolean(),
    result: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
    activityLog: v.union(v.string(), v.null()),
    rawResultEvent: v.optional(v.string()),
    pendingQuestion: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || !task.activeChatWorkflowId) return null;
    if (!task.repoId) return null;
    if (!(await hasRepoAccess(ctx.db, task.repoId, ctx.userId))) {
      throw new Error("Not authorized");
    }

    await sendCompletionEvent(
      ctx,
      agentTaskChatCompleteEvent,
      task.activeChatWorkflowId,
      {
        success: args.success,
        result: args.result,
        error: args.error,
        activityLog: args.activityLog,
        pendingQuestion: args.pendingQuestion,
      },
    );

    await recordCompletionLog(ctx, {
      entityType: "task-chat",
      entityId: String(args.taskId),
      entityTitle: task.title,
      repoId: task.repoId,
      rawResultEvent: args.rawResultEvent,
      projectId: task.projectId,
    });

    return null;
  },
});
