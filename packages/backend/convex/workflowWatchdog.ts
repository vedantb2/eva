import { v } from "convex/values";
import { type MutationCtx, internalMutation } from "./_generated/server";
import { type WorkflowId } from "@convex-dev/workflow";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { cancelTrackedWorkflow } from "./workflowManager";
import { clearStreamingActivity } from "./_taskWorkflow/helpers";
import {
  getProjectConversation,
  setProjectConversation,
} from "./_projects/helpers";
import {
  startNextQueuedDesignMessage,
  startNextQueuedSessionMessage,
  startNextQueuedProjectChatMessage,
  startNextQueuedTaskChatMessage,
} from "./_queues/helpers";

/** Streaming entityId prefix for project chat workflows. */
export const PROJECT_CHAT_STREAM_PREFIX = "project-chat-";
/** Streaming entityId prefix for agent task chat workflows. */
export const TASK_CHAT_STREAM_PREFIX = "task-chat-";

/** Maximum time a workflow run is allowed before being considered stale (2 hours). */
export const RUN_TIMEOUT_MS = 2 * 60 * 60 * 1000;

/** Records a workflow as the active workflow for a session and schedules a stale handler. */
export async function trackSessionWorkflow(
  ctx: MutationCtx,
  sessionId: Id<"sessions">,
  workflowId: WorkflowId,
  timeoutMs: number = RUN_TIMEOUT_MS,
): Promise<void> {
  const id = String(workflowId);
  await ctx.db.patch(sessionId, { activeWorkflowId: id });
  await ctx.scheduler.runAfter(
    timeoutMs,
    internal.workflowWatchdog.handleStaleSession,
    { sessionId, workflowId: id },
  );
}

/** Records a workflow as the active workflow for a design session and schedules a stale handler. */
export async function trackDesignSessionWorkflow(
  ctx: MutationCtx,
  designSessionId: Id<"designSessions">,
  workflowId: WorkflowId,
  timeoutMs: number = RUN_TIMEOUT_MS,
): Promise<void> {
  const id = String(workflowId);
  await ctx.db.patch(designSessionId, { activeWorkflowId: id });
  await ctx.scheduler.runAfter(
    timeoutMs,
    internal.workflowWatchdog.handleStaleDesignSession,
    { designSessionId, workflowId: id },
  );
}

/** Records a workflow as the active workflow for a doc and schedules a stale handler. */
export async function trackDocWorkflow(
  ctx: MutationCtx,
  docId: Id<"docs">,
  workflowId: WorkflowId,
  timeoutMs: number = RUN_TIMEOUT_MS,
): Promise<void> {
  const id = String(workflowId);
  await ctx.db.patch(docId, { activeWorkflowId: id });
  await ctx.scheduler.runAfter(
    timeoutMs,
    internal.workflowWatchdog.handleStaleDoc,
    { docId, workflowId: id },
  );
}

/** Records a workflow as the active workflow for a project and schedules a stale handler. */
export async function trackProjectWorkflow(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  workflowId: WorkflowId,
  timeoutMs: number = RUN_TIMEOUT_MS,
): Promise<void> {
  const id = String(workflowId);
  await ctx.db.patch(projectId, { activeWorkflowId: id });
  await ctx.scheduler.runAfter(
    timeoutMs,
    internal.workflowWatchdog.handleStaleProject,
    { projectId, workflowId: id },
  );
}

/** Records a workflow as the active workflow for an evaluation report (guarded against late-arriving errors) and schedules a stale handler. */
export async function trackEvaluationWorkflow(
  ctx: MutationCtx,
  reportId: Id<"evaluationReports">,
  workflowId: WorkflowId,
  timeoutMs: number = RUN_TIMEOUT_MS,
): Promise<void> {
  const id = String(workflowId);
  const report = await ctx.db.get(reportId);
  if (
    report &&
    report.status !== "error" &&
    report.activeWorkflowId === undefined
  ) {
    await ctx.db.patch(reportId, { activeWorkflowId: id });
  }
  await ctx.scheduler.runAfter(
    timeoutMs,
    internal.workflowWatchdog.handleStaleEvaluation,
    { reportId, workflowId: id },
  );
}

/** Records a workflow as the active chat workflow for a project and schedules a stale handler. */
export async function trackProjectChatWorkflow(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  workflowId: WorkflowId,
  timeoutMs: number = RUN_TIMEOUT_MS,
): Promise<void> {
  const id = String(workflowId);
  await ctx.db.patch(projectId, { activeChatWorkflowId: id });
  await ctx.scheduler.runAfter(
    timeoutMs,
    internal.workflowWatchdog.handleStaleProjectChat,
    { projectId, workflowId: id },
  );
}

/** Records a workflow as the active chat workflow for an agent task and schedules a stale handler. */
export async function trackAgentTaskChatWorkflow(
  ctx: MutationCtx,
  taskId: Id<"agentTasks">,
  workflowId: WorkflowId,
  timeoutMs: number = RUN_TIMEOUT_MS,
): Promise<void> {
  const id = String(workflowId);
  await ctx.db.patch(taskId, { activeChatWorkflowId: id });
  await ctx.scheduler.runAfter(
    timeoutMs,
    internal.workflowWatchdog.handleStaleAgentTaskChat,
    { taskId, workflowId: id },
  );
}

/** Records a workflow as the active build workflow for a project and schedules a stale handler. */
export async function trackProjectBuildWorkflow(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  workflowId: WorkflowId,
  options: { clearLastBuildError?: boolean } = {},
  timeoutMs: number = RUN_TIMEOUT_MS,
): Promise<void> {
  const id = String(workflowId);
  await ctx.db.patch(projectId, {
    activeBuildWorkflowId: id,
    ...(options.clearLastBuildError ? { lastBuildError: undefined } : {}),
  });
  await ctx.scheduler.runAfter(
    timeoutMs,
    internal.workflowWatchdog.handleStaleBuild,
    { projectId, workflowId: id },
  );
}

/** Cancels a workflow by ID and clears streaming activity for associated entities. */
async function cancelStaleWorkflow(
  ctx: MutationCtx,
  workflowId: string,
  streamingEntityIds: string[],
): Promise<void> {
  await cancelTrackedWorkflow(ctx, workflowId);
  for (const entityId of streamingEntityIds) {
    await clearStreamingActivity(ctx, entityId);
  }
}

/** Updates the last assistant message with a timeout error if it has no content yet. */
async function timeoutLastMessage(
  ctx: MutationCtx,
  parentId:
    | Id<"sessions">
    | Id<"designSessions">
    | Id<"projects">
    | Id<"agentTasks">,
  content: string,
): Promise<void> {
  const last = await ctx.db
    .query("messages")
    .withIndex("by_parent", (q) => q.eq("parentId", parentId))
    .order("desc")
    .first();
  if (last && last.role === "assistant" && !last.content) {
    await ctx.db.patch(last._id, { content });
  }
}

/** Cancels a stale chat session workflow and starts the next queued message. */
export const handleStaleSession = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    workflowId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.activeWorkflowId !== args.workflowId) return null;

    await cancelStaleWorkflow(ctx, args.workflowId, [
      String(args.sessionId),
      `summary:${String(args.sessionId)}`,
    ]);

    await timeoutLastMessage(ctx, args.sessionId, "Execution timed out.");

    await ctx.db.patch(args.sessionId, {
      activeWorkflowId: undefined,
      updatedAt: Date.now(),
    });

    await startNextQueuedSessionMessage(ctx, args.sessionId);

    return null;
  },
});

/** Cancels a stale design session workflow and marks the last message as timed out. */
export const handleStaleDesignSession = internalMutation({
  args: {
    designSessionId: v.id("designSessions"),
    workflowId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.designSessionId);
    if (!session || session.activeWorkflowId !== args.workflowId) return null;

    await cancelStaleWorkflow(ctx, args.workflowId, [
      String(args.designSessionId),
    ]);

    await timeoutLastMessage(
      ctx,
      args.designSessionId,
      "Error: Design generation timed out.",
    );

    await ctx.db.patch(args.designSessionId, {
      activeWorkflowId: undefined,
      updatedAt: Date.now(),
    });

    await startNextQueuedDesignMessage(ctx, args.designSessionId);

    return null;
  },
});

/** Cancels a stale evaluation workflow and marks it as timed out or fix error. */
export const handleStaleEvaluation = internalMutation({
  args: {
    reportId: v.id("evaluationReports"),
    workflowId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const report = await ctx.db.get(args.reportId);
    if (!report || report.activeWorkflowId !== args.workflowId) return null;

    await cancelStaleWorkflow(ctx, args.workflowId, [String(args.reportId)]);

    if (report.status === "completed" && report.fixStatus === "fixing") {
      await ctx.db.patch(args.reportId, {
        fixStatus: "fix_error",
        activeWorkflowId: undefined,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.patch(args.reportId, {
        status: "error",
        error: "Evaluation timed out",
        activeWorkflowId: undefined,
        updatedAt: Date.now(),
      });
    }

    return null;
  },
});

/** Cancels a stale doc workflow and updates interview history with an error marker. */
export const handleStaleDoc = internalMutation({
  args: {
    docId: v.id("docs"),
    workflowId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.docId);
    if (!doc || doc.activeWorkflowId !== args.workflowId) return null;

    await cancelStaleWorkflow(ctx, args.workflowId, [String(args.docId)]);

    const patch: Record<
      string,
      undefined | string | typeof doc.interviewHistory
    > = { activeWorkflowId: undefined };

    if (doc.testGenStatus === "running") {
      patch.testGenStatus = "error";
    }

    if (doc.interviewHistory && doc.interviewHistory.length > 0) {
      const history = [...doc.interviewHistory];
      const last = history[history.length - 1];
      if (last && last.role === "assistant" && !last.content) {
        last.content = JSON.stringify({ error: true });
      }
      patch.interviewHistory = history;
    }

    await ctx.db.patch(args.docId, patch);

    return null;
  },
});

/** Cancels a stale project workflow and marks the last message as timed out. */
export const handleStaleProject = internalMutation({
  args: {
    projectId: v.id("projects"),
    workflowId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project || project.activeWorkflowId !== args.workflowId) return null;

    await cancelStaleWorkflow(ctx, args.workflowId, [String(args.projectId)]);

    const conversation = await getProjectConversation(ctx.db, args.projectId);
    const messages = [...conversation];
    const last = messages[messages.length - 1];
    if (last && last.role === "assistant" && !last.content) {
      last.content = JSON.stringify({ error: true });
    }

    await setProjectConversation(ctx.db, args.projectId, messages);
    await ctx.db.patch(args.projectId, {
      activeWorkflowId: undefined,
      lastSandboxActivity: Date.now(),
    });

    return null;
  },
});

/** Marks a stale audit as errored if it is still running. */
export const handleStaleAudit = internalMutation({
  args: {
    auditId: v.id("audits"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const audit = await ctx.db.get(args.auditId);
    if (!audit || audit.status !== "running") return null;

    await ctx.db.patch(args.auditId, {
      status: "error",
      error: "Audit timed out",
    });

    return null;
  },
});

/** Cancels a stale project chat workflow, marks the last message as timed out, and starts the next queued message. */
export const handleStaleProjectChat = internalMutation({
  args: {
    projectId: v.id("projects"),
    workflowId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project || project.activeChatWorkflowId !== args.workflowId)
      return null;

    await cancelStaleWorkflow(ctx, args.workflowId, [
      `${PROJECT_CHAT_STREAM_PREFIX}${String(args.projectId)}`,
    ]);

    await timeoutLastMessage(
      ctx,
      args.projectId,
      "Error: Chat execution timed out.",
    );

    await ctx.db.patch(args.projectId, {
      activeChatWorkflowId: undefined,
      updatedAt: Date.now(),
    });

    await startNextQueuedProjectChatMessage(ctx, args.projectId);
    return null;
  },
});

/** Cancels a stale task chat workflow, marks the last message as timed out, and starts the next queued message. */
export const handleStaleAgentTaskChat = internalMutation({
  args: {
    taskId: v.id("agentTasks"),
    workflowId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || task.activeChatWorkflowId !== args.workflowId) return null;

    await cancelStaleWorkflow(ctx, args.workflowId, [
      `${TASK_CHAT_STREAM_PREFIX}${String(args.taskId)}`,
    ]);

    await timeoutLastMessage(
      ctx,
      args.taskId,
      "Error: Chat execution timed out.",
    );

    await ctx.db.patch(args.taskId, {
      activeChatWorkflowId: undefined,
      updatedAt: Date.now(),
    });

    await startNextQueuedTaskChatMessage(ctx, args.taskId);
    return null;
  },
});

/** Cancels a stale build workflow and clears the active build reference. */
export const handleStaleBuild = internalMutation({
  args: {
    projectId: v.id("projects"),
    workflowId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project || project.activeBuildWorkflowId !== args.workflowId)
      return null;

    await cancelTrackedWorkflow(ctx, args.workflowId);

    await ctx.db.patch(args.projectId, {
      activeBuildWorkflowId: undefined,
    });

    return null;
  },
});
