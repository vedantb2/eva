import { v } from "convex/values";
import {
  type MutationCtx,
  internalAction,
  internalMutation,
} from "./_generated/server";
import { type WorkflowId } from "@convex-dev/workflow";
import type { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { cancelTrackedWorkflow } from "./workflowManager";
import { clearStreamingActivity } from "./_taskWorkflow/helpers";
import {
  STALE_CHECK_DELAY_MS,
  STALE_RECHECK_MS,
  staleTurnDecision,
} from "./_taskWorkflow/staleness";
import { finalizeCancelledAssistantMessage } from "./streaming";
import { getAIModelProvider, normalizeAIModel } from "./validators";
import {
  getProjectConversation,
  setProjectConversation,
} from "./_projects/helpers";
import {
  startNextQueuedSessionMessage,
  startNextQueuedProjectChatMessage,
  startNextQueuedTaskChatMessage,
} from "./_queues/helpers";
import { recomputeProjectPhase } from "./functions";

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
  // No-heartbeat watchdog: the in-sandbox callback touches streamingActivity
  // at least every ~15s while a turn runs, so a silently dead agent process
  // (OOM) shows up as a stale row within minutes. Without this chain the chat
  // sat on "Working…" until the 2h handleStaleSession backstop above.
  await ctx.scheduler.runAfter(
    STALE_CHECK_DELAY_MS,
    internal.workflowWatchdog.checkStaleSessionHeartbeat,
    { sessionId, workflowId: id, turnStartedAt: Date.now() },
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
  // No-heartbeat watchdog — same rationale as trackSessionWorkflow above.
  await ctx.scheduler.runAfter(
    STALE_CHECK_DELAY_MS,
    internal.workflowWatchdog.checkStaleProjectChatHeartbeat,
    { projectId, workflowId: id, turnStartedAt: Date.now() },
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
  // No-heartbeat watchdog — same rationale as trackSessionWorkflow above.
  await ctx.scheduler.runAfter(
    STALE_CHECK_DELAY_MS,
    internal.workflowWatchdog.checkStaleAgentTaskChatHeartbeat,
    { taskId, workflowId: id, turnStartedAt: Date.now() },
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
  await recomputeProjectPhase(ctx, projectId);
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

/**
 * Tears down one tracked session turn: cancels the workflow, salvages the
 * open assistant bubble (streamed text and tool steps survive; an empty
 * bubble is dropped), surfaces the failure as a standalone system alert,
 * interrupts any still-alive agent process the way cancelExecution does, and
 * starts the next queued message. The caller must have verified
 * `session.activeWorkflowId === workflowId`; mutation atomicity makes that
 * guard plus these writes race-free against a concurrent startExecute.
 */
async function finalizeStaleSessionTurn(
  ctx: MutationCtx,
  session: Doc<"sessions">,
  workflowId: string,
  alert: { text: string; detail?: string },
  opts: { sandboxStopped?: boolean } = {},
): Promise<void> {
  const sessionId = session._id;
  // Read the streaming row BEFORE cancelStaleWorkflow clears it — it feeds
  // the salvage of streamed text / tool steps below.
  const streaming = await ctx.db
    .query("streamingActivity")
    .withIndex("by_entity", (q) => q.eq("entityId", String(sessionId)))
    .first();

  await cancelStaleWorkflow(ctx, workflowId, [
    String(sessionId),
    `summary:${String(sessionId)}`,
  ]);

  if (session.syntheticTurnMessageId) {
    const syntheticMessage = await ctx.db.get(session.syntheticTurnMessageId);
    if (syntheticMessage && syntheticMessage.finishedAt === undefined) {
      await finalizeCancelledAssistantMessage(ctx, syntheticMessage, streaming);
    }
  }

  const last = await ctx.db
    .query("messages")
    .withIndex("by_parent", (q) => q.eq("parentId", sessionId))
    .order("desc")
    .first();
  if (
    last &&
    last.role === "assistant" &&
    last.finishedAt === undefined &&
    last._id !== session.syntheticTurnMessageId
  ) {
    await finalizeCancelledAssistantMessage(ctx, last, streaming);
  }

  await ctx.db.insert("messages", {
    parentId: sessionId,
    role: "assistant",
    content: alert.text,
    timestamp: Date.now(),
    isSystemAlert: true,
    ...(alert.detail !== undefined ? { errorDetail: alert.detail } : {}),
  });

  // A stale heartbeat usually means the agent process is dead, but a merely
  // wedged one must not keep mutating the sandbox after the session moves on
  // to its next turn — interrupt it the same way cancelExecution does. When
  // the sandbox itself has stopped there is nothing to interrupt, and
  // killSandboxProcess would exec on the stopped VM — which lazily RESUMES it
  // on Vercel (see prewarmNeverResurrects contract) — so skip the block.
  if (opts.sandboxStopped !== true) {
    if (getAIModelProvider(normalizeAIModel(session.lastModel)) === "claude") {
      await ctx.db.patch(sessionId, { cancelRequestedAt: Date.now() });
    } else if (session.sandboxId) {
      await ctx.scheduler.runAfter(0, internal.sandbox.killSandboxProcess, {
        sandboxId: session.sandboxId,
        repoId: session.repoId,
      });
    }
  }

  const sessionPatch: {
    activeWorkflowId: undefined;
    syntheticTurnMessageId: undefined;
    updatedAt: number;
    status?: "closed";
  } = {
    activeWorkflowId: undefined,
    syntheticTurnMessageId: undefined,
    updatedAt: Date.now(),
  };
  if (opts.sandboxStopped === true) {
    // Surface the stop in the UI — users cannot see the provider dashboard,
    // and an "active" session with a dead VM just looks frozen. "closed" is
    // also what stops page-open prewarm from silently resurrecting the VM
    // (see prewarmDaemon's status guard).
    sessionPatch.status = "closed";
  }
  await ctx.db.patch(sessionId, sessionPatch);

  await startNextQueuedSessionMessage(ctx, sessionId);
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

    await finalizeStaleSessionTurn(ctx, session, args.workflowId, {
      text: "Execution timed out.",
      detail: "Turn exceeded the 2-hour workflow limit.",
    });

    return null;
  },
});

/**
 * Recurring no-heartbeat check for one session turn. Armed by
 * trackSessionWorkflow, re-schedules itself every STALE_RECHECK_MS while the
 * tracked workflow is still the session's active one, and ends with the turn.
 * On staleness it first probes sandbox + callback liveness (transport flaps
 * must not kill live work) and only then finalises the turn — so a dead agent
 * process surfaces as a clear error within minutes instead of hanging on
 * "Working…" until the 2-hour handleStaleSession backstop.
 */
export const checkStaleSessionHeartbeat = internalMutation({
  args: {
    sessionId: v.id("sessions"),
    workflowId: v.string(),
    turnStartedAt: v.number(),
    // Set by the liveness probe once it has confirmed the sandbox/callback is
    // dead, so the kill proceeds without another probe round-trip.
    skipLivenessProbe: v.optional(v.boolean()),
    // Set by the probe when the sandbox VM itself is no longer running (e.g.
    // it hit the provider's runtime limit) — the failure message names the
    // stopped sandbox and the session is closed instead of left "active".
    sandboxStopped: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    // Turn finished or was replaced by a newer one — the chain ends here.
    if (!session || session.activeWorkflowId !== args.workflowId) return null;

    const streaming = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", String(args.sessionId)))
      .first();
    const decision = staleTurnDecision({
      currentActivity: streaming?.currentActivity,
      lastUpdatedAt: streaming?.lastUpdatedAt,
      turnStartedAt: args.turnStartedAt,
      hasSandbox: !!session.sandboxId,
      now: Date.now(),
    });

    if (!decision.stale) {
      await ctx.scheduler.runAfter(
        STALE_RECHECK_MS,
        internal.workflowWatchdog.checkStaleSessionHeartbeat,
        {
          sessionId: args.sessionId,
          workflowId: args.workflowId,
          turnStartedAt: args.turnStartedAt,
        },
      );
      return null;
    }

    // Stale. Probe before killing unless the probe already ran, we are in the
    // startup phase (the callback is not guaranteed to exist yet), or there is
    // no sandbox to probe.
    if (
      !args.skipLivenessProbe &&
      decision.phase !== "startup" &&
      session.sandboxId
    ) {
      await ctx.scheduler.runAfter(
        0,
        internal.workflowWatchdog.probeStaleSessionLiveness,
        {
          sessionId: args.sessionId,
          workflowId: args.workflowId,
          turnStartedAt: args.turnStartedAt,
          sandboxId: session.sandboxId,
          repoId: session.repoId,
          streamingAgeMs: decision.ageMs,
        },
      );
      return null;
    }

    const staleSeconds = Math.round(decision.ageMs / 1000);
    console.log(
      `[watchdog][session-stall] sessionId=${args.sessionId} phase=${decision.phase} ageMs=${decision.ageMs} thresholdMs=${decision.thresholdMs} skipProbe=${args.skipLivenessProbe ?? false} sandboxStopped=${args.sandboxStopped ?? false}`,
    );
    const alert = args.sandboxStopped
      ? {
          text: "Sandbox stopped while this turn was running.",
          detail: `The sandbox VM is no longer running — it likely hit its runtime limit or was stopped outside Eva (no heartbeat for ${staleSeconds}s). The session is now closed; committed work is preserved. Send a new message or start the sandbox to continue.`,
        }
      : {
          text: "Turn stalled: the agent process in the sandbox stopped responding.",
          detail: `No heartbeat for ${staleSeconds}s (phase: ${decision.phase}, threshold: ${Math.round(decision.thresholdMs / 1000)}s). The agent process likely crashed (for example out of memory). The sandbox was preserved — any committed work is intact; send a new message to continue.`,
        };
    await finalizeStaleSessionTurn(ctx, session, args.workflowId, alert, {
      sandboxStopped: args.sandboxStopped === true,
    });
    return null;
  },
});

/**
 * Pre-kill liveness gate for a stale session turn: asks the sandbox provider
 * whether the VM is running and the callback PID (or an agent CLI process) is
 * alive. Alive → touch the streaming row (resets the staleness clock) and
 * keep checking, so transport flaps never kill live work. Dead → re-enter the
 * check with the probe suppressed so the kill proceeds immediately.
 * Unreachable probes report alive (see verifySandboxLiveness), so we never
 * kill on our own inability to verify.
 */
export const probeStaleSessionLiveness = internalAction({
  args: {
    sessionId: v.id("sessions"),
    workflowId: v.string(),
    turnStartedAt: v.number(),
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
    streamingAgeMs: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const liveness = await ctx.runAction(
      internal.sandbox.verifySandboxLiveness,
      { sandboxId: args.sandboxId, repoId: args.repoId },
    );

    console.log(
      `[watchdog][session-probe] sessionId=${args.sessionId} alive=${liveness.alive} reason=${liveness.reason} sandboxState=${liveness.sandboxState ?? "unknown"} pidAlive=${liveness.pidAlive ?? "n/a"} streamingAgeMs=${args.streamingAgeMs}`,
    );

    if (liveness.alive) {
      await ctx.runMutation(internal.streaming.internalTouch, {
        entityId: String(args.sessionId),
      });
      await ctx.scheduler.runAfter(
        STALE_RECHECK_MS,
        internal.workflowWatchdog.checkStaleSessionHeartbeat,
        {
          sessionId: args.sessionId,
          workflowId: args.workflowId,
          turnStartedAt: args.turnStartedAt,
        },
      );
      return null;
    }

    await ctx.scheduler.runAfter(
      0,
      internal.workflowWatchdog.checkStaleSessionHeartbeat,
      {
        sessionId: args.sessionId,
        workflowId: args.workflowId,
        turnStartedAt: args.turnStartedAt,
        skipLivenessProbe: true,
        // "sandbox_not_started" means the VM itself is gone (e.g. provider
        // runtime limit) — a different failure than a dead process on a live
        // VM, and the kill must not exec on it (exec lazily resumes).
        sandboxStopped: liveness.reason === "sandbox_not_started",
      },
    );
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

/**
 * Tears down one tracked project chat turn: cancels the workflow, salvages
 * the open assistant bubble (streamed text and tool steps survive; an empty
 * bubble is dropped), surfaces the failure as a standalone system alert,
 * interrupts any still-alive agent process the way cancelExecution does, and
 * starts the next queued message. The caller must have verified
 * `project.activeChatWorkflowId === workflowId`. Same shape as
 * finalizeStaleSessionTurn — see that doc comment for the full rationale.
 */
async function finalizeStaleProjectChatTurn(
  ctx: MutationCtx,
  project: Doc<"projects">,
  workflowId: string,
  alert: { text: string; detail?: string },
  opts: { sandboxStopped?: boolean } = {},
): Promise<void> {
  const projectId = project._id;
  const streamEntityId = `${PROJECT_CHAT_STREAM_PREFIX}${String(projectId)}`;
  // Read the streaming row BEFORE cancelStaleWorkflow clears it — it feeds
  // the salvage of streamed text / tool steps below.
  const streaming = await ctx.db
    .query("streamingActivity")
    .withIndex("by_entity", (q) => q.eq("entityId", streamEntityId))
    .first();

  await cancelStaleWorkflow(ctx, workflowId, [streamEntityId]);

  if (project.syntheticTurnMessageId) {
    const syntheticMessage = await ctx.db.get(project.syntheticTurnMessageId);
    if (syntheticMessage && syntheticMessage.finishedAt === undefined) {
      await finalizeCancelledAssistantMessage(ctx, syntheticMessage, streaming);
    }
  }

  const last = await ctx.db
    .query("messages")
    .withIndex("by_parent", (q) => q.eq("parentId", projectId))
    .order("desc")
    .first();
  if (
    last &&
    last.role === "assistant" &&
    last.finishedAt === undefined &&
    last._id !== project.syntheticTurnMessageId
  ) {
    await finalizeCancelledAssistantMessage(ctx, last, streaming);
  }

  await ctx.db.insert("messages", {
    parentId: projectId,
    role: "assistant",
    content: alert.text,
    timestamp: Date.now(),
    isSystemAlert: true,
    ...(alert.detail !== undefined ? { errorDetail: alert.detail } : {}),
  });

  // A stale heartbeat usually means the agent process is dead, but a merely
  // wedged one must not keep mutating the sandbox after the chat moves on to
  // its next turn — interrupt it the same way cancelExecution does. When the
  // sandbox itself has stopped there is nothing to interrupt, and
  // killSandboxProcess would exec on the stopped VM — which lazily RESUMES it
  // on Vercel (see prewarmNeverResurrects contract) — so skip the block.
  if (opts.sandboxStopped !== true) {
    if (
      getAIModelProvider(
        normalizeAIModel(project.lastChatModel ?? project.model),
      ) === "claude"
    ) {
      await ctx.db.patch(projectId, { cancelRequestedAt: Date.now() });
    } else if (project.sandboxId) {
      if (project.activeWorkflowId || project.activeBuildWorkflowId) {
        await ctx.scheduler.runAfter(0, internal.sandbox.killEntityDaemon, {
          sandboxId: project.sandboxId,
          repoId: project.repoId,
          entityIdField: "projectId",
          entityId: String(projectId),
        });
      } else {
        await ctx.scheduler.runAfter(0, internal.sandbox.killSandboxProcess, {
          sandboxId: project.sandboxId,
          repoId: project.repoId,
        });
      }
    }
  }

  const projectPatch: {
    activeChatWorkflowId: undefined;
    syntheticTurnMessageId: undefined;
    updatedAt: number;
    reviewProjectSandboxStatus?: "closed";
  } = {
    activeChatWorkflowId: undefined,
    syntheticTurnMessageId: undefined,
    updatedAt: Date.now(),
  };
  if (opts.sandboxStopped === true) {
    // Surface the stop in the UI — mirrors sessionPatch.status = "closed".
    // reviewProjectSandboxStatus tracks the lifecycle of this same
    // project.sandboxId (see _projects/sandbox.ts), so "closed" here is the
    // project-chat equivalent of a session going "closed".
    projectPatch.reviewProjectSandboxStatus = "closed";
  }
  await ctx.db.patch(projectId, projectPatch);

  await startNextQueuedProjectChatMessage(ctx, projectId);
}

/** Cancels a stale project chat workflow via the 2-hour workflow-timeout backstop. */
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

    await finalizeStaleProjectChatTurn(ctx, project, args.workflowId, {
      text: "Execution timed out.",
      detail: "Turn exceeded the 2-hour workflow limit.",
    });

    return null;
  },
});

/**
 * Recurring no-heartbeat check for one project chat turn. Same shape as
 * checkStaleSessionHeartbeat — see that doc comment for the full rationale.
 */
export const checkStaleProjectChatHeartbeat = internalMutation({
  args: {
    projectId: v.id("projects"),
    workflowId: v.string(),
    turnStartedAt: v.number(),
    skipLivenessProbe: v.optional(v.boolean()),
    sandboxStopped: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    // Turn finished or was replaced by a newer one — the chain ends here.
    if (!project || project.activeChatWorkflowId !== args.workflowId)
      return null;

    const streamEntityId = `${PROJECT_CHAT_STREAM_PREFIX}${String(args.projectId)}`;
    const streaming = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", streamEntityId))
      .first();
    const decision = staleTurnDecision({
      currentActivity: streaming?.currentActivity,
      lastUpdatedAt: streaming?.lastUpdatedAt,
      turnStartedAt: args.turnStartedAt,
      hasSandbox: !!project.sandboxId,
      now: Date.now(),
    });

    if (!decision.stale) {
      await ctx.scheduler.runAfter(
        STALE_RECHECK_MS,
        internal.workflowWatchdog.checkStaleProjectChatHeartbeat,
        {
          projectId: args.projectId,
          workflowId: args.workflowId,
          turnStartedAt: args.turnStartedAt,
        },
      );
      return null;
    }

    // Stale. Probe before killing unless the probe already ran, we are in
    // the startup phase (the callback is not guaranteed to exist yet), or
    // there is no sandbox to probe.
    if (
      !args.skipLivenessProbe &&
      decision.phase !== "startup" &&
      project.sandboxId
    ) {
      await ctx.scheduler.runAfter(
        0,
        internal.workflowWatchdog.probeStaleProjectChatLiveness,
        {
          projectId: args.projectId,
          workflowId: args.workflowId,
          turnStartedAt: args.turnStartedAt,
          sandboxId: project.sandboxId,
          repoId: project.repoId,
          streamingAgeMs: decision.ageMs,
        },
      );
      return null;
    }

    const staleSeconds = Math.round(decision.ageMs / 1000);
    console.log(
      `[watchdog][project-chat-stall] projectId=${args.projectId} phase=${decision.phase} ageMs=${decision.ageMs} thresholdMs=${decision.thresholdMs} skipProbe=${args.skipLivenessProbe ?? false} sandboxStopped=${args.sandboxStopped ?? false}`,
    );
    const alert = args.sandboxStopped
      ? {
          text: "Sandbox stopped while this turn was running.",
          detail: `The sandbox VM is no longer running — it likely hit its runtime limit or was stopped outside Eva (no heartbeat for ${staleSeconds}s). The sandbox is now closed; committed work is preserved. Send a new message or start the sandbox to continue.`,
        }
      : {
          text: "Turn stalled: the agent process in the sandbox stopped responding.",
          detail: `No heartbeat for ${staleSeconds}s (phase: ${decision.phase}, threshold: ${Math.round(decision.thresholdMs / 1000)}s). The agent process likely crashed (for example out of memory). The sandbox was preserved — any committed work is intact; send a new message to continue.`,
        };
    await finalizeStaleProjectChatTurn(ctx, project, args.workflowId, alert, {
      sandboxStopped: args.sandboxStopped === true,
    });
    return null;
  },
});

/**
 * Pre-kill liveness gate for a stale project chat turn. Same shape as
 * probeStaleSessionLiveness — see that doc comment for the full rationale.
 */
export const probeStaleProjectChatLiveness = internalAction({
  args: {
    projectId: v.id("projects"),
    workflowId: v.string(),
    turnStartedAt: v.number(),
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
    streamingAgeMs: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const liveness = await ctx.runAction(
      internal.sandbox.verifySandboxLiveness,
      { sandboxId: args.sandboxId, repoId: args.repoId },
    );

    console.log(
      `[watchdog][project-chat-probe] projectId=${args.projectId} alive=${liveness.alive} reason=${liveness.reason} sandboxState=${liveness.sandboxState ?? "unknown"} pidAlive=${liveness.pidAlive ?? "n/a"} streamingAgeMs=${args.streamingAgeMs}`,
    );

    if (liveness.alive) {
      await ctx.runMutation(internal.streaming.internalTouch, {
        entityId: `${PROJECT_CHAT_STREAM_PREFIX}${String(args.projectId)}`,
      });
      await ctx.scheduler.runAfter(
        STALE_RECHECK_MS,
        internal.workflowWatchdog.checkStaleProjectChatHeartbeat,
        {
          projectId: args.projectId,
          workflowId: args.workflowId,
          turnStartedAt: args.turnStartedAt,
        },
      );
      return null;
    }

    await ctx.scheduler.runAfter(
      0,
      internal.workflowWatchdog.checkStaleProjectChatHeartbeat,
      {
        projectId: args.projectId,
        workflowId: args.workflowId,
        turnStartedAt: args.turnStartedAt,
        skipLivenessProbe: true,
        sandboxStopped: liveness.reason === "sandbox_not_started",
      },
    );
    return null;
  },
});

/**
 * Tears down one tracked task chat turn: cancels the workflow, salvages the
 * open assistant bubble (streamed text and tool steps survive; an empty
 * bubble is dropped), surfaces the failure as a standalone system alert,
 * interrupts any still-alive agent process the way cancelExecution does, and
 * starts the next queued message. The caller must have verified
 * `task.activeChatWorkflowId === workflowId`. Same shape as
 * finalizeStaleSessionTurn — see that doc comment for the full rationale.
 */
async function finalizeStaleAgentTaskChatTurn(
  ctx: MutationCtx,
  task: Doc<"agentTasks">,
  workflowId: string,
  alert: { text: string; detail?: string },
  opts: { sandboxStopped?: boolean } = {},
): Promise<void> {
  const taskId = task._id;
  const streamEntityId = `${TASK_CHAT_STREAM_PREFIX}${String(taskId)}`;
  // Read the streaming row BEFORE cancelStaleWorkflow clears it — it feeds
  // the salvage of streamed text / tool steps below.
  const streaming = await ctx.db
    .query("streamingActivity")
    .withIndex("by_entity", (q) => q.eq("entityId", streamEntityId))
    .first();

  await cancelStaleWorkflow(ctx, workflowId, [streamEntityId]);

  if (task.syntheticTurnMessageId) {
    const syntheticMessage = await ctx.db.get(task.syntheticTurnMessageId);
    if (syntheticMessage && syntheticMessage.finishedAt === undefined) {
      await finalizeCancelledAssistantMessage(ctx, syntheticMessage, streaming);
    }
  }

  const last = await ctx.db
    .query("messages")
    .withIndex("by_parent", (q) => q.eq("parentId", taskId))
    .order("desc")
    .first();
  if (
    last &&
    last.role === "assistant" &&
    last.finishedAt === undefined &&
    last._id !== task.syntheticTurnMessageId
  ) {
    await finalizeCancelledAssistantMessage(ctx, last, streaming);
  }

  await ctx.db.insert("messages", {
    parentId: taskId,
    role: "assistant",
    content: alert.text,
    timestamp: Date.now(),
    isSystemAlert: true,
    ...(alert.detail !== undefined ? { errorDetail: alert.detail } : {}),
  });

  // A stale heartbeat usually means the agent process is dead, but a merely
  // wedged one must not keep mutating the sandbox after the chat moves on to
  // its next turn — interrupt it the same way cancelExecution does. When the
  // sandbox itself has stopped there is nothing to interrupt, and
  // killSandboxProcess would exec on the stopped VM — which lazily RESUMES it
  // on Vercel (see prewarmNeverResurrects contract) — so skip the block.
  if (opts.sandboxStopped !== true) {
    if (
      getAIModelProvider(normalizeAIModel(task.lastChatModel ?? task.model)) ===
      "claude"
    ) {
      await ctx.db.patch(taskId, { cancelRequestedAt: Date.now() });
    } else if (task.sandboxId && task.repoId) {
      if (task.activeWorkflowId) {
        await ctx.scheduler.runAfter(0, internal.sandbox.killEntityDaemon, {
          sandboxId: task.sandboxId,
          repoId: task.repoId,
          entityIdField: "taskId",
          entityId: String(taskId),
        });
      } else {
        await ctx.scheduler.runAfter(0, internal.sandbox.killSandboxProcess, {
          sandboxId: task.sandboxId,
          repoId: task.repoId,
        });
      }
    }
  }

  const taskPatch: {
    activeChatWorkflowId: undefined;
    syntheticTurnMessageId: undefined;
    updatedAt: number;
    reviewTaskSandboxStatus?: "closed";
  } = {
    activeChatWorkflowId: undefined,
    syntheticTurnMessageId: undefined,
    updatedAt: Date.now(),
  };
  if (opts.sandboxStopped === true) {
    // Surface the stop in the UI — mirrors sessionPatch.status = "closed".
    // reviewTaskSandboxStatus tracks the lifecycle of this same
    // task.sandboxId (see _agentTasks/sandbox.ts), so "closed" here is the
    // task-chat equivalent of a session going "closed".
    taskPatch.reviewTaskSandboxStatus = "closed";
  }
  await ctx.db.patch(taskId, taskPatch);

  await startNextQueuedTaskChatMessage(ctx, taskId);
}

/** Cancels a stale task chat workflow via the 2-hour workflow-timeout backstop. */
export const handleStaleAgentTaskChat = internalMutation({
  args: {
    taskId: v.id("agentTasks"),
    workflowId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || task.activeChatWorkflowId !== args.workflowId) return null;

    await finalizeStaleAgentTaskChatTurn(ctx, task, args.workflowId, {
      text: "Execution timed out.",
      detail: "Turn exceeded the 2-hour workflow limit.",
    });

    return null;
  },
});

/**
 * Recurring no-heartbeat check for one task chat turn. Same shape as
 * checkStaleSessionHeartbeat — see that doc comment for the full rationale.
 */
export const checkStaleAgentTaskChatHeartbeat = internalMutation({
  args: {
    taskId: v.id("agentTasks"),
    workflowId: v.string(),
    turnStartedAt: v.number(),
    skipLivenessProbe: v.optional(v.boolean()),
    sandboxStopped: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    // Turn finished or was replaced by a newer one — the chain ends here.
    if (!task || task.activeChatWorkflowId !== args.workflowId) return null;

    const streamEntityId = `${TASK_CHAT_STREAM_PREFIX}${String(args.taskId)}`;
    const streaming = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", streamEntityId))
      .first();
    const decision = staleTurnDecision({
      currentActivity: streaming?.currentActivity,
      lastUpdatedAt: streaming?.lastUpdatedAt,
      turnStartedAt: args.turnStartedAt,
      hasSandbox: !!task.sandboxId,
      now: Date.now(),
    });

    if (!decision.stale) {
      await ctx.scheduler.runAfter(
        STALE_RECHECK_MS,
        internal.workflowWatchdog.checkStaleAgentTaskChatHeartbeat,
        {
          taskId: args.taskId,
          workflowId: args.workflowId,
          turnStartedAt: args.turnStartedAt,
        },
      );
      return null;
    }

    // Stale. Probe before killing unless the probe already ran, we are in
    // the startup phase (the callback is not guaranteed to exist yet), or
    // there is no sandbox to probe. verifySandboxLiveness also needs a
    // repoId — agentTasks.repoId is optional (unlike sessions/projects), so
    // a task without one skips straight to the stale-threshold kill instead
    // of guessing a repo.
    if (
      !args.skipLivenessProbe &&
      decision.phase !== "startup" &&
      task.sandboxId &&
      task.repoId
    ) {
      await ctx.scheduler.runAfter(
        0,
        internal.workflowWatchdog.probeStaleAgentTaskChatLiveness,
        {
          taskId: args.taskId,
          workflowId: args.workflowId,
          turnStartedAt: args.turnStartedAt,
          sandboxId: task.sandboxId,
          repoId: task.repoId,
          streamingAgeMs: decision.ageMs,
        },
      );
      return null;
    }

    const staleSeconds = Math.round(decision.ageMs / 1000);
    console.log(
      `[watchdog][task-chat-stall] taskId=${args.taskId} phase=${decision.phase} ageMs=${decision.ageMs} thresholdMs=${decision.thresholdMs} skipProbe=${args.skipLivenessProbe ?? false} sandboxStopped=${args.sandboxStopped ?? false}`,
    );
    const alert = args.sandboxStopped
      ? {
          text: "Sandbox stopped while this turn was running.",
          detail: `The sandbox VM is no longer running — it likely hit its runtime limit or was stopped outside Eva (no heartbeat for ${staleSeconds}s). The sandbox is now closed; committed work is preserved. Send a new message or start the sandbox to continue.`,
        }
      : {
          text: "Turn stalled: the agent process in the sandbox stopped responding.",
          detail: `No heartbeat for ${staleSeconds}s (phase: ${decision.phase}, threshold: ${Math.round(decision.thresholdMs / 1000)}s). The agent process likely crashed (for example out of memory). The sandbox was preserved — any committed work is intact; send a new message to continue.`,
        };
    await finalizeStaleAgentTaskChatTurn(ctx, task, args.workflowId, alert, {
      sandboxStopped: args.sandboxStopped === true,
    });
    return null;
  },
});

/**
 * Pre-kill liveness gate for a stale task chat turn. Same shape as
 * probeStaleSessionLiveness — see that doc comment for the full rationale.
 */
export const probeStaleAgentTaskChatLiveness = internalAction({
  args: {
    taskId: v.id("agentTasks"),
    workflowId: v.string(),
    turnStartedAt: v.number(),
    sandboxId: v.string(),
    repoId: v.id("githubRepos"),
    streamingAgeMs: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const liveness = await ctx.runAction(
      internal.sandbox.verifySandboxLiveness,
      { sandboxId: args.sandboxId, repoId: args.repoId },
    );

    console.log(
      `[watchdog][task-chat-probe] taskId=${args.taskId} alive=${liveness.alive} reason=${liveness.reason} sandboxState=${liveness.sandboxState ?? "unknown"} pidAlive=${liveness.pidAlive ?? "n/a"} streamingAgeMs=${args.streamingAgeMs}`,
    );

    if (liveness.alive) {
      await ctx.runMutation(internal.streaming.internalTouch, {
        entityId: `${TASK_CHAT_STREAM_PREFIX}${String(args.taskId)}`,
      });
      await ctx.scheduler.runAfter(
        STALE_RECHECK_MS,
        internal.workflowWatchdog.checkStaleAgentTaskChatHeartbeat,
        {
          taskId: args.taskId,
          workflowId: args.workflowId,
          turnStartedAt: args.turnStartedAt,
        },
      );
      return null;
    }

    await ctx.scheduler.runAfter(
      0,
      internal.workflowWatchdog.checkStaleAgentTaskChatHeartbeat,
      {
        taskId: args.taskId,
        workflowId: args.workflowId,
        turnStartedAt: args.turnStartedAt,
        skipLivenessProbe: true,
        sandboxStopped: liveness.reason === "sandbox_not_started",
      },
    );
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
    await recomputeProjectPhase(ctx, args.projectId);

    return null;
  },
});
