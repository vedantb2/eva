import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { workflow } from "./workflowManager";
import { trackSessionWorkflow } from "./workflowWatchdog";
import { clearStreamingActivity } from "./_taskWorkflow/helpers";
import { isEntityDeleted } from "./numId";
import { normalizeAIModel } from "./validators";
import {
  orchestratorNotifyChildValidator,
  type OrchestratorNotifyChild,
} from "./orchestratorShared";

/** How much of the child's last reply is quoted back to the master. */
const REPLY_TAIL_CHARS = 500;


/** Everything the wake-up message needs about the child that just finished. */
type ChildSummary = {
  masterSessionId: Id<"sessions">;
  kindLabel: string;
  title: string;
  /** Optional because a quick task can exist before a repo is attached. */
  repoId: Id<"githubRepos"> | undefined;
  parentId: Id<"sessions"> | Id<"agentTasks">;
};

async function loadChildSummary(
  ctx: MutationCtx,
  child: OrchestratorNotifyChild,
): Promise<ChildSummary | null> {
  if (child.kind === "session") {
    const session = await ctx.db.get(child.sessionId);
    if (!session || session.watchedByOrchestrator === undefined) return null;
    return {
      masterSessionId: session.watchedByOrchestrator,
      kindLabel: "session",
      title: session.title,
      repoId: session.repoId,
      parentId: session._id,
    };
  }
  const task = await ctx.db.get(child.taskId);
  if (!task || task.watchedByOrchestrator === undefined) return null;
  return {
    masterSessionId: task.watchedByOrchestrator,
    kindLabel: "task",
    title: task.title,
    repoId: task.repoId,
    parentId: task._id,
  };
}

/** Drops the watch pointer once its master is gone, so we stop re-checking it. */
async function clearWatch(
  ctx: MutationCtx,
  child: OrchestratorNotifyChild,
): Promise<void> {
  if (child.kind === "session") {
    await ctx.db.patch(child.sessionId, { watchedByOrchestrator: undefined });
    return;
  }
  await ctx.db.patch(child.taskId, { watchedByOrchestrator: undefined });
}

/**
 * A master that can still be woken. Archived/deleted masters are gone for good,
 * so their watches are dropped. A `closed` master is deliberately NOT treated as
 * gone: closed only means its sandbox stopped, and starting a turn restarts it —
 * exactly what the web composer does when a user messages a closed session.
 */
function isLiveMaster(
  master: Doc<"sessions"> | null,
): master is Doc<"sessions"> {
  return (
    master !== null && !isEntityDeleted(master) && master.archived !== true
  );
}

/**
 * Trims a quoted child reply to the tail the master is shown — a reply's
 * conclusion is at the end.
 */
function replyTail(content: string): string {
  const trimmed = content.trim();
  return trimmed.length > REPLY_TAIL_CHARS
    ? trimmed.slice(-REPLY_TAIL_CHARS)
    : trimmed;
}

/**
 * Opposite trim for a failure: an alert's meaning is in its first line, and its
 * `errorDetail` usually ends in a stack trace. Tailing one quoted a bare
 * `HX5DX.js:634:28)` fragment at the master, which says nothing about what
 * broke.
 */
function alertHead(content: string): string {
  const trimmed = content.trim();
  return trimmed.length > REPLY_TAIL_CHARS
    ? `${trimmed.slice(0, REPLY_TAIL_CHARS)}…`
    : trimmed;
}

/** The optimistic label the queue-drain hook passes when a child goes idle. */
const DRAIN_IDLE_STATUS = "completed";

/**
 * What actually happened to the child's last turn, read off its newest
 * messages rather than taken from the caller.
 *
 * The queue-drain hook can only report "the child went idle", so it passes
 * `"completed"` for a user cancel and a stall-watchdog kill alike. Both write a
 * system-alert row as the turn's last message, so the child's own transcript is
 * the only place the difference survives — and quoting past the alert (the
 * previous successful reply) told the master a killed turn had succeeded.
 */
async function resolveChildOutcome(
  ctx: MutationCtx,
  parentId: Id<"sessions"> | Id<"agentTasks">,
  reportedStatus: string,
): Promise<{ status: string; tail: string | undefined }> {
  const recent = await ctx.db
    .query("messages")
    .withIndex("by_parent", (q) => q.eq("parentId", parentId))
    .order("desc")
    .take(10);
  const lastAgentRow = recent.find(
    (message) =>
      message.role === "assistant" && message.content.trim().length > 0,
  );
  if (!lastAgentRow) return { status: reportedStatus, tail: undefined };
  if (lastAgentRow.isSystemAlert === true) {
    // The alert IS the outcome: quote it rather than an older, unrelated
    // success. Only the drain's optimistic "completed" is overridden — a caller
    // that already knows what went wrong (e.g. sandboxError) passes a specific
    // status, and flattening that to "interrupted" would lose the reason.
    const detail = lastAgentRow.errorDetail?.trim();
    return {
      status:
        reportedStatus === DRAIN_IDLE_STATUS ? "interrupted" : reportedStatus,
      tail: alertHead(
        detail ? `${lastAgentRow.content}: ${detail}` : lastAgentRow.content,
      ),
    };
  }
  return { status: reportedStatus, tail: replyTail(lastAgentRow.content) };
}

/**
 * Wakes the master session watching a child agent that just went idle.
 *
 * Inserts the wake-up as a normal user-role row (flagged
 * `orchestratorNotification` for styling) and then starts the master's turn the
 * same way a queue drain does — `sessionExecuteWorkflow` owns the assistant
 * placeholder and prompt build, so nothing here duplicates `startExecute`. A
 * busy master gets the wake-up queued instead; several children finishing at
 * once therefore drain one after another rather than racing.
 *
 * Notifications never register a watch of their own, so a woken master cannot
 * notify itself into a loop.
 */
export const notifyOrchestratorOfChild = internalMutation({
  args: {
    child: orchestratorNotifyChildValidator,
    /** Terminal state of the child, e.g. "completed", "error", "cancelled". */
    status: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const summary = await loadChildSummary(ctx, args.child);
    if (!summary) return null;

    const master = await ctx.db.get(summary.masterSessionId);
    if (!isLiveMaster(master)) {
      await clearWatch(ctx, args.child);
      return null;
    }
    // A master cannot watch itself into a self-wake loop.
    if (master._id === summary.parentId) return null;

    const repo =
      summary.repoId === undefined ? null : await ctx.db.get(summary.repoId);
    const repoLabel = repo ? `${repo.owner}/${repo.name}` : "unknown repo";
    const outcome = await resolveChildOutcome(
      ctx,
      summary.parentId,
      args.status,
    );
    const headline = `[agent-notification] ${summary.kindLabel} "${summary.title}" (${repoLabel}) finished: ${outcome.status}`;
    const content =
      outcome.tail === undefined ? headline : `${headline}\n\n${outcome.tail}`;

    const ownerUserId = master.createdBy ?? master.userId;
    const mode = master.lastMode ?? "edit";
    const model = normalizeAIModel(master.lastModel);
    const now = Date.now();

    if (master.activeWorkflowId !== undefined) {
      await ctx.db.insert("queuedMessages", {
        parentId: master._id,
        content,
        createdAt: now,
        order: now,
        userId: ownerUserId,
        mode,
        model,
        providerAccountId: master.providerAccountId,
        reasoningLevel: master.lastReasoningLevel,
        thinkingEnabled: master.lastThinkingEnabled,
        use1mContext: master.lastUse1mContext,
        fastMode: master.lastFastMode,
        orchestratorNotification: true,
      });
      await ctx.db.patch(master._id, { updatedAt: now });
      return null;
    }

    const masterRepo = await ctx.db.get(master.repoId);
    if (!masterRepo) return null;

    // Same order as the queue drain: wipe any stale streaming row before the
    // workflow stages its assistant placeholder, then insert the user row the
    // placeholder answers.
    await clearStreamingActivity(ctx, String(master._id));
    await ctx.db.insert("messages", {
      parentId: master._id,
      role: "user",
      content,
      timestamp: now,
      userId: ownerUserId,
      mode,
      model,
      orchestratorNotification: true,
    });

    const workflowId = await workflow.start(
      ctx,
      internal.sessionWorkflow.sessionExecuteWorkflow,
      {
        sessionId: master._id,
        message: content,
        mode,
        model,
        reasoningLevel: master.lastReasoningLevel,
        thinkingEnabled: master.lastThinkingEnabled,
        use1mContext: master.lastUse1mContext,
        fastMode: master.lastFastMode,
        providerAccountId: master.providerAccountId,
        credentialOwnerUserId: ownerUserId,
        userId: ownerUserId,
        installationId: masterRepo.installationId,
      },
    );
    await ctx.db.patch(master._id, {
      updatedAt: now,
      lastMode: mode,
      lastModel: model,
    });
    await trackSessionWorkflow(ctx, master._id, workflowId);
    return null;
  },
});
