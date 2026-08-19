import type { MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import type { WorkflowId } from "@convex-dev/workflow";
import { internal } from "../_generated/api";
import { workflow } from "../workflowManager";
import { DEFAULT_AI_MODEL } from "../validators";
import {
  PROJECT_CHAT_STREAM_PREFIX,
  TASK_CHAT_STREAM_PREFIX,
  trackAgentTaskChatWorkflow,
  trackProjectChatWorkflow,
  trackSessionWorkflow,
} from "../_chat/surfaceAdapters";
import { resolveCredentialSourceLabel } from "../_userProviderAccounts/credentialSource";
import { clearStreamingActivity } from "../_taskWorkflow/helpers";
import type { OrchestratorNotifyChild } from "../orchestratorShared";

const QUEUE_RUN_TIMEOUT_MS = 2 * 60 * 60 * 1000;

/** Outcome of a queue config's pre-start guard: `ok: false` aborts before anything is cleared or inserted. */
type ChatQueueGuardResult<TPrepared> =
  | { ok: true; data: TPrepared }
  | { ok: false; error: string };

/**
 * Everything `startNextQueuedChatMessage` needs to dequeue and start the next
 * queued turn for one chat surface. Every function that writes to the
 * entity's own table is a closure defined at the concrete adapter (so `TId`
 * is a single branded id there, never the generic union) — the shared core
 * below never calls `ctx.db.patch`/`ctx.db.insert` on the entity table
 * itself.
 */
type ChatQueueConfig<
  TId extends Id<"sessions"> | Id<"agentTasks"> | Id<"projects">,
  TEntity,
  TPrepared,
> = {
  getEntity: (ctx: MutationCtx, id: TId) => Promise<TEntity | null>;
  hasActiveWorkflow: (entity: TEntity) => boolean;
  streamingEntityId: (id: TId) => string;
  /**
   * Validates the entity/message can start a workflow, returning any extra
   * data (e.g. session's repo + narrowed mode/model) the insert/start steps
   * need. Runs BEFORE the streaming row is cleared, matching current
   * behavior — a guard failure leaves nothing to clear.
   */
  prepareGuard: (
    ctx: MutationCtx,
    entity: TEntity,
    next: Doc<"queuedMessages">,
  ) => Promise<ChatQueueGuardResult<TPrepared>>;
  insertUserMessage: (
    ctx: MutationCtx,
    id: TId,
    entity: TEntity,
    next: Doc<"queuedMessages">,
    prepared: TPrepared,
    now: number,
  ) => Promise<void>;
  startWorkflow: (
    ctx: MutationCtx,
    id: TId,
    entity: TEntity,
    next: Doc<"queuedMessages">,
    prepared: TPrepared,
  ) => Promise<WorkflowId>;
  /** Patches `updatedAt` and records the started workflow as this entity's active one. */
  onStarted: (
    ctx: MutationCtx,
    id: TId,
    workflowId: WorkflowId,
    now: number,
  ) => Promise<void>;
  /** Inserts an assistant error bubble and touches `updatedAt`. */
  recordError: (ctx: MutationCtx, id: TId, content: string) => Promise<void>;
  /**
   * The wake-up payload for the master session watching this entity, or
   * `undefined` when it is unwatched (or when the surface cannot be watched at
   * all). Read off the already-loaded entity, so the shared core below pays no
   * extra read and never has to guess a field name per surface.
   */
  orchestratorNotifyChild: (
    entity: TEntity,
    id: TId,
  ) => OrchestratorNotifyChild | undefined;
  defaultStartErrorMessage: string;
};

/**
 * Dequeues and starts the next pending message for one chat surface. Single
 * implementation shared by sessions, project chat, and task chat — the three
 * exported `startNextQueuedX` functions below are thin `config` bindings so a
 * fix here reaches all three surfaces by construction.
 */
async function startNextQueuedChatMessage<
  TId extends Id<"sessions"> | Id<"agentTasks"> | Id<"projects">,
  TEntity,
  TPrepared,
>(
  ctx: MutationCtx,
  id: TId,
  config: ChatQueueConfig<TId, TEntity, TPrepared>,
): Promise<boolean> {
  const entity = await config.getEntity(ctx, id);
  if (!entity || config.hasActiveWorkflow(entity)) {
    return false;
  }

  /**
   * Wakes the master session watching this entity. Every turn-finished path
   * (workflow completion, synthetic turn, cancel, stall teardown) ends by
   * draining the queue here, and we only reach this function once the entity
   * has no active workflow — so "the drain started nothing" is exactly "the
   * child went idle". Hooking that single fact keeps mid-queue turns silent
   * without every completion mutation remembering to check.
   */
  const watchedChild = config.orchestratorNotifyChild(entity, id);
  async function notifyWatchingOrchestrator(status: string): Promise<void> {
    if (!watchedChild) return;
    await ctx.scheduler.runAfter(
      0,
      internal.orchestratorNotify.notifyOrchestratorOfChild,
      { child: watchedChild, status },
    );
  }

  const nextMessage = await ctx.db
    .query("queuedMessages")
    .withIndex("by_parent_and_order", (q) => q.eq("parentId", id))
    .order("asc")
    .first();
  if (!nextMessage) {
    await notifyWatchingOrchestrator("completed");
    return false;
  }

  await ctx.db.delete(nextMessage._id);

  const guard = await config.prepareGuard(ctx, entity, nextMessage);
  if (!guard.ok) {
    await config.recordError(ctx, id, guard.error);
    // The queued turn is consumed and cannot run, so the child is idle again —
    // without this the master would wait forever on a turn that never starts.
    await notifyWatchingOrchestrator("error");
    return false;
  }

  // Wipe any stale streaming row before the new turn's placeholder appears —
  // a leftover row (old warm daemon, one-shot provider, crashed turn) would
  // render the finished turn's reply/activity under the new placeholder (see
  // startExecute in _sessions/execution.ts). Every dequeue does this, because
  // not every caller clears first: _sessions/sandbox.ts drains queued turns
  // straight after a resume, with no clear of its own.
  await clearStreamingActivity(ctx, config.streamingEntityId(id));

  const now = Date.now();
  await config.insertUserMessage(ctx, id, entity, nextMessage, guard.data, now);

  try {
    const workflowId = await config.startWorkflow(
      ctx,
      id,
      entity,
      nextMessage,
      guard.data,
    );
    await config.onStarted(ctx, id, workflowId, now);
    return true;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : config.defaultStartErrorMessage;
    await config.recordError(ctx, id, `Error: ${errorMessage}`);
    await notifyWatchingOrchestrator("error");
    return false;
  }
}

type SessionQueuePrepared = {
  repo: Doc<"githubRepos">;
  mode: NonNullable<Doc<"queuedMessages">["mode"]>;
  model: NonNullable<Doc<"queuedMessages">["model"]>;
};

const sessionQueueConfig: ChatQueueConfig<
  Id<"sessions">,
  Doc<"sessions">,
  SessionQueuePrepared
> = {
  getEntity: (ctx, id) => ctx.db.get(id),
  hasActiveWorkflow: (session) => session.activeWorkflowId !== undefined,
  streamingEntityId: (id) => String(id),
  prepareGuard: async (ctx, session, next) => {
    if (!next.mode || !next.model) {
      return { ok: false, error: "Error: Failed to start queued message." };
    }
    const repo = await ctx.db.get(session.repoId);
    if (!repo) {
      return {
        ok: false,
        error: "Error: Repository not found for queued message.",
      };
    }
    return { ok: true, data: { repo, mode: next.mode, model: next.model } };
  },
  insertUserMessage: async (ctx, id, session, next, prepared, now) => {
    await ctx.db.insert("messages", {
      parentId: id,
      role: "user",
      content: next.displayContent ?? next.content,
      timestamp: now,
      userId: next.userId,
      mode: prepared.mode,
      attachmentStorageIds: next.attachmentStorageIds,
      personaId: next.personaId,
      credentialSourceLabel: await resolveCredentialSourceLabel(
        ctx.db,
        session.providerAccountId,
        session.createdBy ?? session.userId,
      ),
      model: prepared.model,
      reasoningLevel: next.reasoningLevel,
      orchestratorNotification: next.orchestratorNotification,
      sentViaOrchestrator: next.sentViaOrchestrator,
    });
  },
  startWorkflow: (ctx, id, session, next, prepared) =>
    workflow.start(ctx, internal.sessionWorkflow.sessionExecuteWorkflow, {
      sessionId: id,
      message: next.content,
      mode: prepared.mode,
      model: prepared.model,
      reasoningLevel: next.reasoningLevel,
      thinkingEnabled: next.thinkingEnabled,
      use1mContext: next.use1mContext,
      fastMode: next.fastMode,
      providerAccountId: session.providerAccountId,
      credentialOwnerUserId: session.createdBy ?? session.userId,
      personaId: next.personaId,
      numDesigns: next.numDesigns,
      userId: next.userId,
      installationId: prepared.repo.installationId,
    }),
  onStarted: async (ctx, id, workflowId, now) => {
    await ctx.db.patch(id, { updatedAt: now });
    await trackSessionWorkflow(ctx, id, workflowId, QUEUE_RUN_TIMEOUT_MS);
  },
  recordError: async (ctx, id, content) => {
    await ctx.db.insert("messages", {
      parentId: id,
      role: "assistant",
      content,
      timestamp: Date.now(),
    });
    await ctx.db.patch(id, { updatedAt: Date.now() });
  },
  orchestratorNotifyChild: (session, id) =>
    session.watchedByOrchestrator === undefined
      ? undefined
      : { kind: "session", sessionId: id },
  defaultStartErrorMessage: "Failed to start queued message.",
};

/**
 * `sessionQueueConfig` with the orchestrator wake-up suppressed, for the one
 * drain that is NOT a turn ending: `sandboxReady` (`_sessions/sandbox.ts`)
 * drains after a sandbox start/resume, where an empty queue means "nothing was
 * waiting" rather than "the child just went idle". Left on the notifying config,
 * merely starting a watched session's sandbox woke its master with a spurious
 * "finished: completed" carrying the tail of an older reply.
 */
const sessionSandboxReadyQueueConfig: ChatQueueConfig<
  Id<"sessions">,
  Doc<"sessions">,
  SessionQueuePrepared
> = {
  ...sessionQueueConfig,
  orchestratorNotifyChild: () => undefined,
};

const projectChatQueueConfig: ChatQueueConfig<
  Id<"projects">,
  Doc<"projects">,
  undefined
> = {
  getEntity: (ctx, id) => ctx.db.get(id),
  hasActiveWorkflow: (project) => project.activeChatWorkflowId !== undefined,
  streamingEntityId: (id) => `${PROJECT_CHAT_STREAM_PREFIX}${String(id)}`,
  prepareGuard: async () => ({ ok: true, data: undefined }),
  insertUserMessage: async (ctx, id, project, next, _prepared, now) => {
    await ctx.db.insert("messages", {
      parentId: id,
      role: "user",
      content: next.content,
      timestamp: now,
      userId: next.userId,
      attachmentStorageIds: next.attachmentStorageIds,
      credentialSourceLabel: await resolveCredentialSourceLabel(
        ctx.db,
        project.providerAccountId,
        project.userId,
      ),
      model: next.model,
      reasoningLevel: next.reasoningLevel,
    });
  },
  startWorkflow: (ctx, id, project, next) =>
    workflow.start(
      ctx,
      internal.projectChatWorkflow.projectChatExecuteWorkflow,
      {
        projectId: id,
        message: next.content,
        model: next.model ?? DEFAULT_AI_MODEL,
        reasoningLevel: next.reasoningLevel,
        thinkingEnabled: next.thinkingEnabled,
        use1mContext: next.use1mContext,
        fastMode: next.fastMode,
        providerAccountId: project.providerAccountId,
        credentialOwnerUserId: project.userId,
        userId: next.userId,
      },
    ),
  onStarted: async (ctx, id, workflowId, now) => {
    await ctx.db.patch(id, { updatedAt: now });
    await trackProjectChatWorkflow(ctx, id, workflowId, QUEUE_RUN_TIMEOUT_MS);
  },
  recordError: async (ctx, id, content) => {
    await ctx.db.insert("messages", {
      parentId: id,
      role: "assistant",
      content,
      timestamp: Date.now(),
    });
    await ctx.db.patch(id, { updatedAt: Date.now() });
  },
  // Project chat has no orchestrator watch — only sessions and tasks are
  // spawned as child agents.
  orchestratorNotifyChild: () => undefined,
  defaultStartErrorMessage: "Failed to start queued chat message.",
};

const taskChatQueueConfig: ChatQueueConfig<
  Id<"agentTasks">,
  Doc<"agentTasks">,
  undefined
> = {
  getEntity: (ctx, id) => ctx.db.get(id),
  hasActiveWorkflow: (task) => task.activeChatWorkflowId !== undefined,
  streamingEntityId: (id) => `${TASK_CHAT_STREAM_PREFIX}${String(id)}`,
  prepareGuard: async () => ({ ok: true, data: undefined }),
  insertUserMessage: async (ctx, id, task, next, _prepared, now) => {
    await ctx.db.insert("messages", {
      parentId: id,
      role: "user",
      content: next.content,
      timestamp: now,
      userId: next.userId,
      attachmentStorageIds: next.attachmentStorageIds,
      credentialSourceLabel: await resolveCredentialSourceLabel(
        ctx.db,
        task.providerAccountId,
        task.createdBy,
      ),
      model: next.model,
      reasoningLevel: next.reasoningLevel,
      sentViaOrchestrator: next.sentViaOrchestrator,
    });
  },
  startWorkflow: (ctx, id, task, next) =>
    workflow.start(
      ctx,
      internal.agentTaskChatWorkflow.agentTaskChatExecuteWorkflow,
      {
        taskId: id,
        message: next.content,
        model: next.model ?? DEFAULT_AI_MODEL,
        reasoningLevel: next.reasoningLevel,
        thinkingEnabled: next.thinkingEnabled,
        use1mContext: next.use1mContext,
        fastMode: next.fastMode,
        providerAccountId: task.providerAccountId,
        credentialOwnerUserId: task.createdBy,
        userId: next.userId,
      },
    ),
  onStarted: async (ctx, id, workflowId, now) => {
    await ctx.db.patch(id, { updatedAt: now });
    await trackAgentTaskChatWorkflow(ctx, id, workflowId, QUEUE_RUN_TIMEOUT_MS);
  },
  recordError: async (ctx, id, content) => {
    await ctx.db.insert("messages", {
      parentId: id,
      role: "assistant",
      content,
      timestamp: Date.now(),
    });
    await ctx.db.patch(id, { updatedAt: Date.now() });
  },
  orchestratorNotifyChild: (task, id) =>
    task.watchedByOrchestrator === undefined
      ? undefined
      : { kind: "task", taskId: id },
  defaultStartErrorMessage: "Failed to start queued chat message.",
};

/** Dequeues and starts the next pending message for a session, launching its workflow. */
export function startNextQueuedSessionMessage(
  ctx: MutationCtx,
  sessionId: Id<"sessions">,
): Promise<boolean> {
  return startNextQueuedChatMessage(ctx, sessionId, sessionQueueConfig);
}

/**
 * Dequeues after a sandbox start/resume. Identical to
 * `startNextQueuedSessionMessage` except it never wakes a watching orchestrator
 * — see `sessionSandboxReadyQueueConfig`.
 */
export function startNextQueuedSessionMessageAfterSandboxReady(
  ctx: MutationCtx,
  sessionId: Id<"sessions">,
): Promise<boolean> {
  return startNextQueuedChatMessage(
    ctx,
    sessionId,
    sessionSandboxReadyQueueConfig,
  );
}

/** Dequeues and starts the next pending chat message for a project. */
export function startNextQueuedProjectChatMessage(
  ctx: MutationCtx,
  projectId: Id<"projects">,
): Promise<boolean> {
  return startNextQueuedChatMessage(ctx, projectId, projectChatQueueConfig);
}

/** Dequeues and starts the next pending chat message for an agent task. */
export function startNextQueuedTaskChatMessage(
  ctx: MutationCtx,
  taskId: Id<"agentTasks">,
): Promise<boolean> {
  return startNextQueuedChatMessage(ctx, taskId, taskChatQueueConfig);
}
