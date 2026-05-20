import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";
import { workflow } from "../workflowManager";
import { DEFAULT_AI_MODEL } from "../validators";
import {
  trackAgentTaskChatWorkflow,
  trackDesignSessionWorkflow,
  trackProjectChatWorkflow,
  trackSessionWorkflow,
} from "../workflowWatchdog";

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
    .withIndex("by_parent_and_created", (q) => q.eq("parentId", sessionId))
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

  const now = Date.now();
  await ctx.db.insert("messages", {
    parentId: sessionId,
    role: "user",
    content: nextMessage.content,
    timestamp: now,
    userId: nextMessage.userId,
    mode: nextMessage.mode,
  });

  try {
    const workflowId = await workflow.start(
      ctx,
      internal.sessionWorkflow.sessionExecuteWorkflow,
      {
        sessionId,
        message: nextMessage.content,
        mode: nextMessage.mode,
        model: nextMessage.model,
        userId: nextMessage.userId,
        installationId: repo.installationId,
      },
    );

    await ctx.db.patch(sessionId, { updatedAt: now });
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

/** Dequeues and starts the next pending message for a design session, launching its workflow. */
export async function startNextQueuedDesignMessage(
  ctx: MutationCtx,
  designSessionId: Id<"designSessions">,
): Promise<boolean> {
  const session = await ctx.db.get(designSessionId);
  if (!session || session.activeWorkflowId) {
    return false;
  }

  const nextMessage = await ctx.db
    .query("queuedMessages")
    .withIndex("by_parent_and_created", (q) =>
      q.eq("parentId", designSessionId),
    )
    .order("asc")
    .first();
  if (!nextMessage) {
    return false;
  }

  await ctx.db.delete(nextMessage._id);

  const now = Date.now();
  await ctx.db.insert("messages", {
    parentId: designSessionId,
    role: "user",
    content: nextMessage.content,
    timestamp: now,
    userId: nextMessage.userId,
    personaId: nextMessage.personaId,
  });

  const assistantMessageId = await ctx.db.insert("messages", {
    parentId: designSessionId,
    role: "assistant",
    content: "",
    timestamp: now,
    activityLog: "",
  });

  try {
    const workflowId = await workflow.start(
      ctx,
      internal.designWorkflow.designSessionWorkflow,
      {
        designSessionId,
        message: nextMessage.content,
        model: nextMessage.model ?? DEFAULT_AI_MODEL,
        personaId: nextMessage.personaId,
        userId: nextMessage.userId,
        numDesigns: nextMessage.numDesigns ?? 3,
      },
    );

    await ctx.db.patch(designSessionId, { updatedAt: now });
    await trackDesignSessionWorkflow(
      ctx,
      designSessionId,
      workflowId,
      QUEUE_RUN_TIMEOUT_MS,
    );

    return true;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to start queued design.";
    await ctx.db.patch(assistantMessageId, {
      content: `Error: ${errorMessage}`,
    });
    await ctx.db.patch(designSessionId, { updatedAt: Date.now() });
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
    .withIndex("by_parent_and_created", (q) => q.eq("parentId", projectId))
    .order("asc")
    .first();
  if (!nextMessage) {
    return false;
  }

  await ctx.db.delete(nextMessage._id);

  const now = Date.now();
  await ctx.db.insert("messages", {
    parentId: projectId,
    role: "user",
    content: nextMessage.content,
    timestamp: now,
    userId: nextMessage.userId,
  });

  try {
    const workflowId = await workflow.start(
      ctx,
      internal.projectChatWorkflow.projectChatExecuteWorkflow,
      {
        projectId,
        message: nextMessage.content,
        model: nextMessage.model ?? DEFAULT_AI_MODEL,
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
    .withIndex("by_parent_and_created", (q) => q.eq("parentId", taskId))
    .order("asc")
    .first();
  if (!nextMessage) {
    return false;
  }

  await ctx.db.delete(nextMessage._id);

  const now = Date.now();
  await ctx.db.insert("messages", {
    parentId: taskId,
    role: "user",
    content: nextMessage.content,
    timestamp: now,
    userId: nextMessage.userId,
  });

  try {
    const workflowId = await workflow.start(
      ctx,
      internal.agentTaskChatWorkflow.agentTaskChatExecuteWorkflow,
      {
        taskId,
        message: nextMessage.content,
        model: nextMessage.model ?? DEFAULT_AI_MODEL,
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
