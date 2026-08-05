import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import {
  internalMutation,
  type MutationCtx,
} from "./_generated/server";
import { SANDBOX_DELETE_GRACE_MS } from "./_sandbox/vercelSnapshotOptions";

const SWEEP_BATCH_SIZE = 16;
const DELETE_STAGGER_MS = 2000;

function isSessionDead(session: Doc<"sessions">): boolean {
  return session.archived === true;
}

function isTaskDead(task: Doc<"agentTasks">): boolean {
  return task.status === "done" || task.status === "cancelled";
}

function pastGrace(
  now: number,
  sandboxDeleteAfter: number | undefined,
  updatedAt: number | undefined,
): boolean {
  if (sandboxDeleteAfter !== undefined && now < sandboxDeleteAfter) {
    return false;
  }
  if (updatedAt !== undefined && now - updatedAt < SANDBOX_DELETE_GRACE_MS) {
    return false;
  }
  return true;
}

/**
 * Patch `sandboxDeleteAfter` and schedule maybe-delete after the grace window.
 * Duplicate schedules are harmless — the mutation re-checks at fire time.
 */
export async function scheduleSessionSandboxGraceDelete(
  ctx: MutationCtx,
  session: Doc<"sessions">,
): Promise<void> {
  if (!session.sandboxId) return;
  const sandboxDeleteAfter = Date.now() + SANDBOX_DELETE_GRACE_MS;
  await ctx.db.patch(session._id, { sandboxDeleteAfter });
  await ctx.scheduler.runAfter(
    SANDBOX_DELETE_GRACE_MS,
    internal.sandboxCleanup.maybeDeleteSessionSandbox,
    { sessionId: session._id },
  );
}

/** Clear a pending grace delete when the session becomes alive again. */
export async function cancelSessionSandboxGraceDelete(
  ctx: MutationCtx,
  sessionId: Id<"sessions">,
): Promise<void> {
  await ctx.db.patch(sessionId, { sandboxDeleteAfter: undefined });
}

/**
 * Patch + schedule grace delete for a dead quick-task sandbox.
 */
export async function scheduleTaskSandboxGraceDelete(
  ctx: MutationCtx,
  task: Doc<"agentTasks">,
): Promise<void> {
  if (!task.sandboxId) return;
  const sandboxDeleteAfter = Date.now() + SANDBOX_DELETE_GRACE_MS;
  await ctx.db.patch(task._id, { sandboxDeleteAfter });
  await ctx.scheduler.runAfter(
    SANDBOX_DELETE_GRACE_MS,
    internal.sandboxCleanup.maybeDeleteTaskSandbox,
    { taskId: task._id },
  );
}

/** Fired 48h after session death — deletes sandbox if still dead + due. */
export const maybeDeleteSessionSandbox = internalMutation({
  args: { sessionId: v.id("sessions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;

    if (!isSessionDead(session)) {
      await ctx.db.patch(session._id, { sandboxDeleteAfter: undefined });
      return null;
    }

    const now = Date.now();
    if (session.sandboxDeleteAfter === undefined) return null;
    if (now < session.sandboxDeleteAfter) return null;
    if (!session.sandboxId) return null;
    if (session.status !== "closed") return null;

    const sandboxId = session.sandboxId;
    await ctx.scheduler.runAfter(0, internal.sandbox.deleteSandbox, {
      sandboxId,
      repoId: session.repoId,
    });
    await ctx.db.patch(session._id, {
      sandboxId: undefined,
      sandboxDeleteAfter: undefined,
    });
    return null;
  },
});

/** Fired 48h after task done/cancelled — deletes sandbox if still dead + due. */
export const maybeDeleteTaskSandbox = internalMutation({
  args: { taskId: v.id("agentTasks") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return null;

    if (!isTaskDead(task)) {
      await ctx.db.patch(task._id, { sandboxDeleteAfter: undefined });
      return null;
    }

    const now = Date.now();
    if (task.sandboxDeleteAfter === undefined) return null;
    if (now < task.sandboxDeleteAfter) return null;
    if (!task.sandboxId || !task.repoId) return null;

    const sandboxId = task.sandboxId;
    const repoId = task.repoId;
    await ctx.scheduler.runAfter(0, internal.sandbox.deleteSandbox, {
      sandboxId,
      repoId,
    });
    await ctx.db.patch(task._id, {
      sandboxId: undefined,
      sandboxDeleteAfter: undefined,
    });
    return null;
  },
});

/**
 * One-off backlog sweep + weekly cron body. Deletes sandboxes for dead
 * sessions/tasks whose grace has elapsed.
 */
export const sweepDeadSandboxes = internalMutation({
  args: {
    cursor: v.optional(v.string()),
    phase: v.optional(v.union(v.literal("sessions"), v.literal("agentTasks"))),
    deleted: v.optional(v.number()),
  },
  returns: v.object({
    deleted: v.number(),
    done: v.boolean(),
    phase: v.union(v.literal("sessions"), v.literal("agentTasks")),
  }),
  handler: async (ctx, args) => {
    const phase = args.phase ?? "sessions";
    let deleted = args.deleted ?? 0;
    const now = Date.now();

    if (phase === "sessions") {
      const page = await ctx.db.query("sessions").paginate({
        cursor: args.cursor ?? null,
        numItems: SWEEP_BATCH_SIZE,
      });

      let staggerIndex = 0;
      for (const session of page.page) {
        if (!session.sandboxId) continue;
        if (session.status !== "closed") continue;
        if (!isSessionDead(session)) continue;
        if (!pastGrace(now, session.sandboxDeleteAfter, session.updatedAt)) {
          continue;
        }

        const sandboxId = session.sandboxId;
        await ctx.scheduler.runAfter(
          staggerIndex * DELETE_STAGGER_MS,
          internal.sandbox.deleteSandbox,
          { sandboxId, repoId: session.repoId },
        );
        await ctx.db.patch(session._id, {
          sandboxId: undefined,
          sandboxDeleteAfter: undefined,
        });
        deleted += 1;
        staggerIndex += 1;
      }

      if (!page.isDone) {
        await ctx.scheduler.runAfter(0, internal.sandboxCleanup.sweepDeadSandboxes, {
          cursor: page.continueCursor,
          phase: "sessions",
          deleted,
        });
        return { deleted, done: false, phase: "sessions" as const };
      }

      await ctx.scheduler.runAfter(0, internal.sandboxCleanup.sweepDeadSandboxes, {
        phase: "agentTasks",
        deleted,
      });
      return { deleted, done: false, phase: "sessions" as const };
    }

    const page = await ctx.db.query("agentTasks").paginate({
      cursor: args.cursor ?? null,
      numItems: SWEEP_BATCH_SIZE,
    });

    let staggerIndex = 0;
    for (const task of page.page) {
      if (!task.sandboxId || !task.repoId) continue;
      if (!isTaskDead(task)) continue;
      if (!pastGrace(now, task.sandboxDeleteAfter, task.updatedAt)) {
        continue;
      }

      const sandboxId = task.sandboxId;
      const repoId = task.repoId;
      await ctx.scheduler.runAfter(
        staggerIndex * DELETE_STAGGER_MS,
        internal.sandbox.deleteSandbox,
        { sandboxId, repoId },
      );
      await ctx.db.patch(task._id, {
        sandboxId: undefined,
        sandboxDeleteAfter: undefined,
      });
      deleted += 1;
      staggerIndex += 1;
    }

    if (!page.isDone) {
      await ctx.scheduler.runAfter(0, internal.sandboxCleanup.sweepDeadSandboxes, {
        cursor: page.continueCursor,
        phase: "agentTasks",
        deleted,
      });
      return { deleted, done: false, phase: "agentTasks" as const };
    }

    console.log(
      `[sandboxCleanup] sweepDeadSandboxes done: deleted=${deleted}`,
    );
    return { deleted, done: true, phase: "agentTasks" as const };
  },
});
