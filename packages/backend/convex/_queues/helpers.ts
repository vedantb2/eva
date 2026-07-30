import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";
import { workflow } from "../workflowManager";
import { DEFAULT_AI_MODEL } from "../validators";
import {
  PROJECT_CHAT_STREAM_PREFIX,
  TASK_CHAT_STREAM_PREFIX,
  trackAgentTaskChatWorkflow,
  trackProjectChatWorkflow,
  trackSessionWorkflow,
} from "../workflowWatchdog";
import { resolveCredentialSourceLabel } from "../_userProviderAccounts/credentialSource";
import { clearStreamingActivity } from "../_taskWorkflow/helpers";

const QUEUE_RUN_TIMEOUT_MS = 2 * 60 * 60 * 1000;

/** Dequeues and starts the next pending message for a session, launching its workflow. */
export async function startNextQueuedSessionMessage(
  ctx: MutationCtx,
  sessionId: Id<"sessions">,
): Promise<boolean> {
  const session = await ctx.db.get(sessionId);
  if (!session || session.activeWorkflowId) {
    return false;
  }

  const nextMessage = await ctx.db
    .query("queuedMessages")
    .withIndex("by_parent_and_order", (q) => q.eq("parentId", sessionId))
    .order("asc")
    .first();
  if (!nextMessage) {
    return false;
  }

  await ctx.db.delete(nextMessage._id);

  if (!nextMessage.mode || !nextMessage.model) {
    await ctx.db.insert("messages", {
      parentId: sessionId,
      role: "assistant",
      content: "Error: Failed to start queued message.",
      timestamp: Date.now(),
    });
    await ctx.db.patch(sessionId, { updatedAt: Date.now() });
    return false;
  }

  const repo = await ctx.db.get(session.repoId);
  if (!repo) {
    await ctx.db.insert("messages", {
      parentId: sessionId,
      role: "assistant",
      content: "Error: Repository not found for queued message.",
      timestamp: Date.now(),
    });
    await ctx.db.patch(sessionId, { updatedAt: Date.now() });
    return false;
  }

  // Wipe any stale streaming row before the new turn's placeholder appears —
  // a leftover row (old warm daemon, one-shot provider, crashed turn) would
  // render the finished turn's reply/activity under the new placeholder (see
  // startExecute in _sessions/execution.ts). Every dequeue below does this,
  // because not every caller clears first: _sessions/sandbox.ts drains queued
  // turns straight after a resume, with no clear of its own.
  await clearStreamingActivity(ctx, String(sessionId));

  const now = Date.now();
  await ctx.db.insert("messages", {
    parentId: sessionId,
    role: "user",
    content: nextMessage.displayContent ?? nextMessage.content,
    timestamp: now,
    userId: nextMessage.userId,
    mode: nextMessage.mode,
    attachmentStorageIds: nextMessage.attachmentStorageIds,
    personaId: nextMessage.personaId,
    credentialSourceLabel: await resolveCredentialSourceLabel(
      ctx.db,
      session.providerAccountId,
      session.createdBy ?? session.userId,
    ),
    model: nextMessage.model,
    reasoningLevel: nextMessage.reasoningLevel,
  });

  try {
    const credentialOwnerUserId = session.createdBy ?? session.userId;
    const workflowId = await workflow.start(
      ctx,
      internal.sessionWorkflow.sessionExecuteWorkflow,
      {
        sessionId,
        message: nextMessage.content,
        mode: nextMessage.mode,
        model: nextMessage.model,
        reasoningLevel: nextMessage.reasoningLevel,
        thinkingEnabled: nextMessage.thinkingEnabled,
        use1mContext: nextMessage.use1mContext,
        providerAccountId: session.providerAccountId,
        credentialOwnerUserId,
        personaId: nextMessage.personaId,
        numDesigns: nextMessage.numDesigns,
        userId: nextMessage.userId,
        installationId: repo.installationId,
      },
    );

    await ctx.db.patch(sessionId, {
      updatedAt: now,
    });
    await trackSessionWorkflow(
      ctx,
      sessionId,
      workflowId,
      QUEUE_RUN_TIMEOUT_MS,
    );

    return true;
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to start queued message.";
    await ctx.db.insert("messages", {
      parentId: sessionId,
      role: "assistant",
      content: `Error: ${errorMessage}`,
      timestamp: Date.now(),
    });
    await ctx.db.patch(sessionId, { updatedAt: Date.now() });
    return false;
  }
}

/** Dequeues and starts the next pending chat message for a project. */
export async function startNextQueuedProjectChatMessage(
  ctx: MutationCtx,
  projectId: Id<"projects">,
): Promise<boolean> {
  const project = await ctx.db.get(projectId);
  if (!project || project.activeChatWorkflowId) {
    return false;
  }

  const nextMessage = await ctx.db
    .query("queuedMessages")
    .withIndex("by_parent_and_order", (q) => q.eq("parentId", projectId))
    .order("asc")
    .first();
  if (!nextMessage) {
    return false;
  }

  await ctx.db.delete(nextMessage._id);

  // See startNextQueuedSessionMessage above for why every dequeue clears.
  await clearStreamingActivity(
    ctx,
    `${PROJECT_CHAT_STREAM_PREFIX}${String(projectId)}`,
  );

  const now = Date.now();
  await ctx.db.insert("messages", {
    parentId: projectId,
    role: "user",
    content: nextMessage.content,
    timestamp: now,
    userId: nextMessage.userId,
    attachmentStorageIds: nextMessage.attachmentStorageIds,
    credentialSourceLabel: await resolveCredentialSourceLabel(
      ctx.db,
      project.providerAccountId,
      project.userId,
    ),
    model: nextMessage.model,
    reasoningLevel: nextMessage.reasoningLevel,
  });

  try {
    const workflowId = await workflow.start(
      ctx,
      internal.projectChatWorkflow.projectChatExecuteWorkflow,
      {
        projectId,
        message: nextMessage.content,
        model: nextMessage.model ?? DEFAULT_AI_MODEL,
        reasoningLevel: nextMessage.reasoningLevel,
        thinkingEnabled: nextMessage.thinkingEnabled,
        use1mContext: nextMessage.use1mContext,
        providerAccountId: project.providerAccountId,
        credentialOwnerUserId: project.userId,
        userId: nextMessage.userId,
      },
    );

    await ctx.db.patch(projectId, { updatedAt: now });
    await trackProjectChatWorkflow(
      ctx,
      projectId,
      workflowId,
      QUEUE_RUN_TIMEOUT_MS,
    );
    return true;
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to start queued chat message.";
    await ctx.db.insert("messages", {
      parentId: projectId,
      role: "assistant",
      content: `Error: ${errorMessage}`,
      timestamp: Date.now(),
    });
    await ctx.db.patch(projectId, { updatedAt: Date.now() });
    return false;
  }
}

/** Dequeues and starts the next pending chat message for an agent task. */
export async function startNextQueuedTaskChatMessage(
  ctx: MutationCtx,
  taskId: Id<"agentTasks">,
): Promise<boolean> {
  const task = await ctx.db.get(taskId);
  if (!task || task.activeChatWorkflowId) {
    return false;
  }

  const nextMessage = await ctx.db
    .query("queuedMessages")
    .withIndex("by_parent_and_order", (q) => q.eq("parentId", taskId))
    .order("asc")
    .first();
  if (!nextMessage) {
    return false;
  }

  await ctx.db.delete(nextMessage._id);

  // See startNextQueuedSessionMessage above for why every dequeue clears.
  await clearStreamingActivity(
    ctx,
    `${TASK_CHAT_STREAM_PREFIX}${String(taskId)}`,
  );

  const now = Date.now();
  await ctx.db.insert("messages", {
    parentId: taskId,
    role: "user",
    content: nextMessage.content,
    timestamp: now,
    userId: nextMessage.userId,
    attachmentStorageIds: nextMessage.attachmentStorageIds,
    credentialSourceLabel: await resolveCredentialSourceLabel(
      ctx.db,
      task.providerAccountId,
      task.createdBy,
    ),
    model: nextMessage.model,
    reasoningLevel: nextMessage.reasoningLevel,
  });

  try {
    const workflowId = await workflow.start(
      ctx,
      internal.agentTaskChatWorkflow.agentTaskChatExecuteWorkflow,
      {
        taskId,
        message: nextMessage.content,
        model: nextMessage.model ?? DEFAULT_AI_MODEL,
        reasoningLevel: nextMessage.reasoningLevel,
        thinkingEnabled: nextMessage.thinkingEnabled,
        use1mContext: nextMessage.use1mContext,
        providerAccountId: task.providerAccountId,
        credentialOwnerUserId: task.createdBy,
        userId: nextMessage.userId,
      },
    );

    await ctx.db.patch(taskId, { updatedAt: now });
    await trackAgentTaskChatWorkflow(
      ctx,
      taskId,
      workflowId,
      QUEUE_RUN_TIMEOUT_MS,
    );
    return true;
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to start queued chat message.";
    await ctx.db.insert("messages", {
      parentId: taskId,
      role: "assistant",
      content: `Error: ${errorMessage}`,
      timestamp: Date.now(),
    });
    await ctx.db.patch(taskId, { updatedAt: Date.now() });
    return false;
  }
}
