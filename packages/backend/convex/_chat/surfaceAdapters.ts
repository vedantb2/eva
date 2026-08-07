import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import { getAIModelProvider, normalizeAIModel } from "../validators";
import {
  startNextQueuedProjectChatMessage,
  startNextQueuedSessionMessage,
  startNextQueuedTaskChatMessage,
} from "../_queues/helpers";
import {
  advanceOpenTurn,
  findOpenTurn,
  openTurn,
  type TurnSurface,
} from "./turnStore";
import type { WorkflowId } from "@convex-dev/workflow";

/** Streaming entityId prefix for project chat workflows. */
export const PROJECT_CHAT_STREAM_PREFIX = "project-chat-";
/** Streaming entityId prefix for agent task chat workflows. */
export const TASK_CHAT_STREAM_PREFIX = "task-chat-";

/** The entity id types the three chat surfaces are keyed by. */
export type ChatSurfaceId =
  | Id<"sessions">
  | Id<"agentTasks">
  | Id<"projects">;

/** A standalone system-alert message surfaced when a stale turn is torn down. */
export type ChatAlert = { text: string; detail?: string };

/**
 * Everything the shared stall-watchdog logic (`_chat/stallWatchdog.ts`) needs
 * to know about one chat surface (session, task chat, project chat), typed
 * per-surface so the shared code never has to guess a field name or table.
 * Read/write access to the entity is deliberately closure-shaped — every
 * function that touches `ctx.db` for the entity's own table lives inside the
 * adapter, so the generic shared code only ever calls opaque functions
 * instead of writing table-specific patches itself.
 */
export type ChatSurfaceAdapter<TId extends ChatSurfaceId, TEntity> = {
  kind: "session" | "taskChat" | "projectChat";
  /** Console-log prefix, e.g. "session", "task-chat", "project-chat". */
  logLabel: string;
  /** Console-log key for the id, e.g. "sessionId". */
  idLogLabel: string;
  getEntity: (ctx: MutationCtx, id: TId) => Promise<TEntity | null>;
  /** Turns a `turns.entityId` string back into this surface's typed id. */
  normalizeId: (ctx: QueryCtx, entityId: string) => TId | null;
  /** The model recorded on the turn row (last chat model, falling back). */
  turnModel: (entity: TEntity) => string;
  activeWorkflowId: (entity: TEntity) => string | undefined;
  /** Mirrors the workflow id onto the entity's own active-workflow field. */
  setActiveWorkflowId: (
    ctx: MutationCtx,
    id: TId,
    workflowId: string,
  ) => Promise<void>;
  /** Entity id used for the turn's own streamingActivity row. */
  streamingEntityId: (id: TId) => string;
  /** Any additional streamingActivity rows to clear alongside the turn's own (sessions also clear their summary row). */
  extraStreamingClears: (id: TId) => string[];
  syntheticTurnMessageId: (entity: TEntity) => Id<"messages"> | undefined;
  sandboxId: (entity: TEntity) => string | undefined;
  repoId: (entity: TEntity) => Id<"githubRepos"> | undefined;
  /** Interrupts a still-alive agent process the way cancelExecution does. */
  interrupt: (ctx: MutationCtx, entity: TEntity) => Promise<void>;
  /** Clears the active workflow + synthetic turn, and closes the sandbox status field if `sandboxStopped`. */
  release: (
    ctx: MutationCtx,
    id: TId,
    opts: { sandboxStopped: boolean },
  ) => Promise<void>;
  /** Starts the next queued message for this entity, if any. */
  drainQueue: (ctx: MutationCtx, id: TId) => Promise<boolean>;
  alerts: {
    timeout: ChatAlert;
    sandboxStopped: (staleSeconds: number) => ChatAlert;
    stalled: (
      staleSeconds: number,
      phase: string,
      thresholdSeconds: number,
    ) => ChatAlert;
  };
};

/** Alert text shared by every surface when the agent process itself has gone silent (not the sandbox VM). */
function stalledAlert(
  staleSeconds: number,
  phase: string,
  thresholdSeconds: number,
): ChatAlert {
  return {
    text: "Turn stalled: the agent process in the sandbox stopped responding.",
    detail: `No heartbeat for ${staleSeconds}s (phase: ${phase}, threshold: ${thresholdSeconds}s). The agent process likely crashed (for example out of memory). The sandbox was preserved — any committed work is intact; send a new message to continue.`,
  };
}

/** Alert text shared by every surface for the 2-hour workflow-timeout backstop. */
const timeoutAlert: ChatAlert = {
  text: "Execution timed out.",
  detail: "Turn exceeded the 2-hour workflow limit.",
};

export const sessionChatAdapter: ChatSurfaceAdapter<
  Id<"sessions">,
  Doc<"sessions">
> = {
  kind: "session",
  logLabel: "session",
  idLogLabel: "sessionId",
  getEntity: (ctx, id) => ctx.db.get(id),
  normalizeId: (ctx, entityId) => ctx.db.normalizeId("sessions", entityId),
  turnModel: (session) => normalizeAIModel(session.lastModel),
  activeWorkflowId: (session) => session.activeWorkflowId,
  setActiveWorkflowId: async (ctx, id, workflowId) => {
    await ctx.db.patch(id, { activeWorkflowId: workflowId });
  },
  streamingEntityId: (id) => String(id),
  extraStreamingClears: (id) => [`summary:${String(id)}`],
  syntheticTurnMessageId: (session) => session.syntheticTurnMessageId,
  sandboxId: (session) => session.sandboxId,
  repoId: (session) => session.repoId,
  interrupt: async (ctx, session) => {
    if (getAIModelProvider(normalizeAIModel(session.lastModel)) === "claude") {
      await ctx.db.patch(session._id, { cancelRequestedAt: Date.now() });
    } else if (session.sandboxId) {
      await ctx.scheduler.runAfter(0, internal.sandbox.killSandboxProcess, {
        sandboxId: session.sandboxId,
        repoId: session.repoId,
      });
    }
  },
  release: async (ctx, id, opts) => {
    const patch: {
      activeWorkflowId: undefined;
      syntheticTurnMessageId: undefined;
      updatedAt: number;
      status?: "closed";
    } = {
      activeWorkflowId: undefined,
      syntheticTurnMessageId: undefined,
      updatedAt: Date.now(),
    };
    if (opts.sandboxStopped) {
      // Surfaces the stop in the UI — users cannot see the provider
      // dashboard, and an "active" session with a dead VM just looks
      // frozen. "closed" is also what stops page-open prewarm from
      // silently resurrecting the VM (see prewarmDaemon's status guard).
      patch.status = "closed";
    }
    await ctx.db.patch(id, patch);
  },
  drainQueue: (ctx, id) => startNextQueuedSessionMessage(ctx, id),
  alerts: {
    timeout: timeoutAlert,
    sandboxStopped: (staleSeconds) => ({
      text: "Sandbox stopped while this turn was running.",
      detail: `The sandbox VM is no longer running — it likely hit its runtime limit or was stopped outside Eva (no heartbeat for ${staleSeconds}s). The session is now closed; committed work is preserved. Send a new message or start the sandbox to continue.`,
    }),
    stalled: stalledAlert,
  },
};

export const taskChatAdapter: ChatSurfaceAdapter<
  Id<"agentTasks">,
  Doc<"agentTasks">
> = {
  kind: "taskChat",
  logLabel: "task-chat",
  idLogLabel: "taskId",
  getEntity: (ctx, id) => ctx.db.get(id),
  normalizeId: (ctx, entityId) => ctx.db.normalizeId("agentTasks", entityId),
  turnModel: (task) => normalizeAIModel(task.lastChatModel ?? task.model),
  activeWorkflowId: (task) => task.activeChatWorkflowId,
  setActiveWorkflowId: async (ctx, id, workflowId) => {
    await ctx.db.patch(id, { activeChatWorkflowId: workflowId });
  },
  streamingEntityId: (id) => `${TASK_CHAT_STREAM_PREFIX}${String(id)}`,
  extraStreamingClears: () => [],
  syntheticTurnMessageId: (task) => task.syntheticTurnMessageId,
  sandboxId: (task) => task.sandboxId,
  repoId: (task) => task.repoId,
  interrupt: async (ctx, task) => {
    if (
      getAIModelProvider(normalizeAIModel(task.lastChatModel ?? task.model)) ===
      "claude"
    ) {
      await ctx.db.patch(task._id, { cancelRequestedAt: Date.now() });
    } else if (task.sandboxId && task.repoId) {
      if (task.activeWorkflowId) {
        await ctx.scheduler.runAfter(0, internal.sandbox.killEntityDaemon, {
          sandboxId: task.sandboxId,
          repoId: task.repoId,
          entityIdField: "taskId",
          entityId: String(task._id),
        });
      } else {
        await ctx.scheduler.runAfter(0, internal.sandbox.killSandboxProcess, {
          sandboxId: task.sandboxId,
          repoId: task.repoId,
        });
      }
    }
  },
  release: async (ctx, id, opts) => {
    const patch: {
      activeChatWorkflowId: undefined;
      syntheticTurnMessageId: undefined;
      updatedAt: number;
      reviewTaskSandboxStatus?: "closed";
    } = {
      activeChatWorkflowId: undefined,
      syntheticTurnMessageId: undefined,
      updatedAt: Date.now(),
    };
    if (opts.sandboxStopped) {
      // Mirrors sessionPatch.status = "closed" above; reviewTaskSandboxStatus
      // tracks the lifecycle of this same task.sandboxId (see
      // _agentTasks/sandbox.ts).
      patch.reviewTaskSandboxStatus = "closed";
    }
    await ctx.db.patch(id, patch);
  },
  drainQueue: (ctx, id) => startNextQueuedTaskChatMessage(ctx, id),
  alerts: {
    timeout: timeoutAlert,
    sandboxStopped: (staleSeconds) => ({
      text: "Sandbox stopped while this turn was running.",
      detail: `The sandbox VM is no longer running — it likely hit its runtime limit or was stopped outside Eva (no heartbeat for ${staleSeconds}s). The sandbox is now closed; committed work is preserved. Send a new message or start the sandbox to continue.`,
    }),
    stalled: stalledAlert,
  },
};

export const projectChatAdapter: ChatSurfaceAdapter<
  Id<"projects">,
  Doc<"projects">
> = {
  kind: "projectChat",
  logLabel: "project-chat",
  idLogLabel: "projectId",
  getEntity: (ctx, id) => ctx.db.get(id),
  normalizeId: (ctx, entityId) => ctx.db.normalizeId("projects", entityId),
  turnModel: (project) =>
    normalizeAIModel(project.lastChatModel ?? project.model),
  activeWorkflowId: (project) => project.activeChatWorkflowId,
  setActiveWorkflowId: async (ctx, id, workflowId) => {
    await ctx.db.patch(id, { activeChatWorkflowId: workflowId });
  },
  streamingEntityId: (id) => `${PROJECT_CHAT_STREAM_PREFIX}${String(id)}`,
  extraStreamingClears: () => [],
  syntheticTurnMessageId: (project) => project.syntheticTurnMessageId,
  sandboxId: (project) => project.sandboxId,
  repoId: (project) => project.repoId,
  interrupt: async (ctx, project) => {
    if (
      getAIModelProvider(
        normalizeAIModel(project.lastChatModel ?? project.model),
      ) === "claude"
    ) {
      await ctx.db.patch(project._id, { cancelRequestedAt: Date.now() });
    } else if (project.sandboxId) {
      if (project.activeWorkflowId || project.activeBuildWorkflowId) {
        await ctx.scheduler.runAfter(0, internal.sandbox.killEntityDaemon, {
          sandboxId: project.sandboxId,
          repoId: project.repoId,
          entityIdField: "projectId",
          entityId: String(project._id),
        });
      } else {
        await ctx.scheduler.runAfter(0, internal.sandbox.killSandboxProcess, {
          sandboxId: project.sandboxId,
          repoId: project.repoId,
        });
      }
    }
  },
  release: async (ctx, id, opts) => {
    const patch: {
      activeChatWorkflowId: undefined;
      syntheticTurnMessageId: undefined;
      updatedAt: number;
      reviewProjectSandboxStatus?: "closed";
    } = {
      activeChatWorkflowId: undefined,
      syntheticTurnMessageId: undefined,
      updatedAt: Date.now(),
    };
    if (opts.sandboxStopped) {
      // Mirrors sessionPatch.status = "closed" above;
      // reviewProjectSandboxStatus tracks the lifecycle of this same
      // project.sandboxId (see _projects/sandbox.ts).
      patch.reviewProjectSandboxStatus = "closed";
    }
    await ctx.db.patch(id, patch);
  },
  drainQueue: (ctx, id) => startNextQueuedProjectChatMessage(ctx, id),
  alerts: {
    timeout: timeoutAlert,
    sandboxStopped: (staleSeconds) => ({
      text: "Sandbox stopped while this turn was running.",
      detail: `The sandbox VM is no longer running — it likely hit its runtime limit or was stopped outside Eva (no heartbeat for ${staleSeconds}s). The sandbox is now closed; committed work is preserved. Send a new message or start the sandbox to continue.`,
    }),
    stalled: stalledAlert,
  },
};

/**
 * Every chat surface's adapter, registered once. The drift-guard test
 * (`tests/chatSurfaceUnificationContract.test.ts`) pins that a fourth surface
 * cannot exist without appearing here.
 */
export const chatSurfaceAdapters = [
  sessionChatAdapter,
  taskChatAdapter,
  projectChatAdapter,
] as const;

/**
 * Opens the turn row for one chat surface. This is the only place a chat turn
 * begins, for all three surfaces and for both kinds of turn: user-initiated
 * (a workflow drives it) and daemon-minted continuations (no workflow, the
 * runner's heartbeat is the sole renewer).
 */
export async function openChatTurn<TId extends ChatSurfaceId, TEntity>(
  ctx: MutationCtx,
  adapter: ChatSurfaceAdapter<TId, TEntity>,
  id: TId,
  opts: { workflowId?: string; placeholderMessageId?: Id<"messages"> } = {},
): Promise<Id<"turns">> {
  const entity = await adapter.getEntity(ctx, id);
  return await openTurn(ctx, {
    surface: adapter.kind,
    entityId: String(id),
    streamingEntityId: adapter.streamingEntityId(id),
    model: entity ? adapter.turnModel(entity) : "unknown",
    ...(opts.workflowId !== undefined ? { workflowId: opts.workflowId } : {}),
    ...(opts.placeholderMessageId !== undefined
      ? { placeholderMessageId: opts.placeholderMessageId }
      : {}),
    ...(entity ? { sandboxId: adapter.sandboxId(entity) } : {}),
    ...(entity ? { repoId: adapter.repoId(entity) } : {}),
  });
}

/**
 * Opens a turn and mirrors the workflow id onto the entity.
 *
 * There is no scheduler work here any more. The old version armed a 2-hour
 * backstop plus a self-rescheduling heartbeat check per turn — mechanism that
 * only ran if its own scheduler entries survived. The lease on the row carries
 * the same guarantees (the 2-hour ceiling is the lease cap, I4) and the 60s
 * reconciler cron converges anything whose owner died, whatever killed it.
 */
async function trackChatWorkflow<TId extends ChatSurfaceId, TEntity>(
  ctx: MutationCtx,
  adapter: ChatSurfaceAdapter<TId, TEntity>,
  id: TId,
  workflowId: WorkflowId,
): Promise<void> {
  const workflow = String(workflowId);
  await openChatTurn(ctx, adapter, id, { workflowId: workflow });
  await adapter.setActiveWorkflowId(ctx, id, workflow);
}

/** Records a workflow as the active workflow for a session and opens its turn. */
export async function trackSessionWorkflow(
  ctx: MutationCtx,
  sessionId: Id<"sessions">,
  workflowId: WorkflowId,
): Promise<void> {
  await trackChatWorkflow(ctx, sessionChatAdapter, sessionId, workflowId);
}

/** Records a workflow as the active chat workflow for a project and opens its turn. */
export async function trackProjectChatWorkflow(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  workflowId: WorkflowId,
): Promise<void> {
  await trackChatWorkflow(ctx, projectChatAdapter, projectId, workflowId);
}

/** Records a workflow as the active chat workflow for an agent task and opens its turn. */
export async function trackAgentTaskChatWorkflow(
  ctx: MutationCtx,
  taskId: Id<"agentTasks">,
  workflowId: WorkflowId,
): Promise<void> {
  await trackChatWorkflow(ctx, taskChatAdapter, taskId, workflowId);
}

/**
 * Moves the entity's open turn into `launching` and re-grants the startup
 * lease. Called from the sandbox resume/prepare/launch steps, so a slow clone
 * or a cold VM keeps the turn alive without the lease having to be generous
 * enough for the worst case up front.
 */
export async function markChatTurnLaunching(
  ctx: MutationCtx,
  surface: TurnSurface,
  entityId: string,
  sandboxId?: string,
): Promise<string | null> {
  await advanceOpenTurn(ctx, surface, entityId, "launching", { sandboxId });
  // Returned so the workflow can hand it to a one-shot runner as `TURN_ID`.
  const turn = await findOpenTurn(ctx, surface, entityId);
  return turn ? String(turn._id) : null;
}

/**
 * Moves the entity's open turn into `finalizing`. The callback has reported
 * its result and stops heartbeating from here, so the lease switches to the
 * finishing allowance that covers push / PR-create / save.
 */
export async function markChatTurnFinalizing(
  ctx: MutationCtx,
  surface: TurnSurface,
  entityId: string,
): Promise<void> {
  await advanceOpenTurn(ctx, surface, entityId, "finalizing");
}
