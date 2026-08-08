import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import {
  internalAction,
  internalMutation,
  internalQuery,
  type MutationCtx,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { authQuery } from "./functions";
import {
  markChatTurnLaunching,
  projectChatAdapter,
  sessionChatAdapter,
  taskChatAdapter,
} from "./_chat/surfaceAdapters";
import type { ChatSurfaceAdapter } from "./_chat/surfaceAdapters";
import { finalizeStaleChatTurn } from "./_chat/stallWatchdog";
import { closeTurn, renewTurnLease } from "./_chat/turnStore";
import { isPastRunTimeout, leaseDurationMs } from "./_chat/turnLease";

const surfaceValidator = v.union(
  v.literal("session"),
  v.literal("taskChat"),
  v.literal("projectChat"),
);

const turnStateValidator = v.union(
  v.literal("staged"),
  v.literal("launching"),
  v.literal("running"),
  v.literal("finalizing"),
  v.literal("done"),
  v.literal("error"),
  v.literal("cancelled"),
);

/**
 * The one signal the UI uses for "Working…" (I1). An open row means a turn is
 * running; no row means it is not. Nothing else — not `activeWorkflowId`, not
 * an empty placeholder message, not the age of a streaming row — gets a vote.
 */
export const getOpen = authQuery({
  args: { surface: surfaceValidator, entityId: v.string() },
  // No turn id: presence is the whole signal, and leaving the branded id out
  // lets the send path write this query optimistically without minting one.
  returns: v.union(
    v.object({
      state: turnStateValidator,
      turnStartedAt: v.number(),
      model: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const turn = await ctx.db
      .query("turns")
      .withIndex("by_entity_open", (q) =>
        q
          .eq("surface", args.surface)
          .eq("entityId", args.entityId)
          .eq("open", true),
      )
      .first();
    if (!turn) return null;
    return {
      state: turn.state,
      turnStartedAt: turn.turnStartedAt,
      model: turn.model,
    };
  },
});

const leaseVerdictValidator = v.union(
  v.object({
    status: v.literal("renewed"),
    leaseExpiresAt: v.number(),
    durationMs: v.number(),
  }),
  v.object({
    status: v.literal("terminal"),
    reason: v.union(
      v.literal("unknown_turn"),
      v.literal("closed"),
      v.literal("superseded"),
      v.literal("timeout"),
      v.literal("cancelled"),
    ),
  }),
);

/**
 * Lease renewal, called by the HMAC-verified streaming heartbeat route. The
 * callback treats a `terminal` verdict as an order to exit, so a runner whose
 * turn was superseded stops touching the sandbox on its next ping instead of
 * living on as a zombie.
 */
export const renew = internalMutation({
  args: {
    turnId: v.string(),
    currentActivity: v.optional(v.string()),
    streamingEntityId: v.optional(v.string()),
  },
  returns: leaseVerdictValidator,
  handler: async (ctx, args) =>
    renewTurnLease(ctx, args.turnId, {
      currentActivity: args.currentActivity,
      streamingEntityId: args.streamingEntityId,
    }),
});

/**
 * Moves a turn into `launching` once its sandbox is resolved, re-granting the
 * startup lease and recording the sandbox so the reconciler can probe it. One
 * generic mutation for all three surfaces — the workflows call it as a durable
 * step right after the sandbox is prepared or resumed.
 */
export const markLaunching = internalMutation({
  args: {
    surface: surfaceValidator,
    entityId: v.string(),
    sandboxId: v.optional(v.string()),
  },
  // The open turn's id, so a one-shot launch can carry it as `TURN_ID`.
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) =>
    await markChatTurnLaunching(
      ctx,
      args.surface,
      args.entityId,
      args.sandboxId,
    ),
});

/**
 * Open turns whose lease has lapsed — the reconciler's whole work list. `now`
 * comes from the caller: Convex caches a query until its data changes, never on
 * a timer, so a query that read the clock itself would keep answering with the
 * time of its first run.
 */
export const listExpired = internalQuery({
  args: { limit: v.number(), now: v.number() },
  returns: v.array(
    v.object({
      turnId: v.id("turns"),
      surface: surfaceValidator,
      sandboxId: v.optional(v.string()),
      repoId: v.optional(v.id("githubRepos")),
    }),
  ),
  handler: async (ctx, args) => {
    const expired = await ctx.db
      .query("turns")
      .withIndex("by_open_lease", (q) =>
        q.eq("open", true).lt("leaseExpiresAt", args.now),
      )
      .take(args.limit);
    return expired.map((turn) => ({
      turnId: turn._id,
      surface: turn.surface,
      sandboxId: turn.sandboxId,
      repoId: turn.repoId,
    }));
  },
});

/**
 * Tears down one expired turn through the surface's own adapter, reusing the
 * exact teardown the stall watchdogs used: cancel the workflow, salvage the
 * streamed bubble, post an alert, interrupt any live process, release the
 * entity fields, start the next queued message.
 */
async function finalizeExpiredTurn<
  TId extends Id<"sessions"> | Id<"agentTasks"> | Id<"projects">,
  TEntity,
>(
  ctx: MutationCtx,
  adapter: ChatSurfaceAdapter<TId, TEntity>,
  turn: Doc<"turns">,
  sandboxStopped: boolean,
): Promise<void> {
  const now = Date.now();
  const timedOut = isPastRunTimeout(turn.turnStartedAt, now);
  const thresholdSeconds = Math.round(leaseDurationMs(turn.state) / 1000);
  const staleSeconds =
    Math.round(Math.max(0, now - turn.leaseExpiresAt) / 1000) +
    thresholdSeconds;
  const alert = timedOut
    ? adapter.alerts.timeout
    : sandboxStopped
      ? adapter.alerts.sandboxStopped(staleSeconds)
      : adapter.alerts.stalled(staleSeconds, turn.state, thresholdSeconds);

  console.log(
    `[turns][reconcile] surface=${turn.surface} entityId=${turn.entityId} state=${turn.state} lateMs=${now - turn.leaseExpiresAt} timedOut=${timedOut} sandboxStopped=${sandboxStopped}`,
  );

  const id = adapter.normalizeId(ctx, turn.entityId);
  const entity = id ? await adapter.getEntity(ctx, id) : null;
  if (id && entity) {
    await finalizeStaleChatTurn(
      ctx,
      adapter,
      id,
      entity,
      adapter.activeWorkflowId(entity) ?? turn.workflowId,
      alert,
      { sandboxStopped },
    );
  }
  await closeTurn(ctx, turn, "error", { error: alert.text });
}

/**
 * Converges one expired turn. Re-reads the row inside the mutation so a lease
 * renewed between the reconciler's query and this write is respected — the
 * owner always wins a race against the reconciler.
 */
export const finalizeExpired = internalMutation({
  args: { turnId: v.id("turns"), sandboxStopped: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const turn = await ctx.db.get(args.turnId);
    if (!turn || !turn.open) return null;
    if (turn.leaseExpiresAt >= Date.now()) return null;

    switch (turn.surface) {
      case "session":
        await finalizeExpiredTurn(
          ctx,
          sessionChatAdapter,
          turn,
          args.sandboxStopped,
        );
        break;
      case "taskChat":
        await finalizeExpiredTurn(
          ctx,
          taskChatAdapter,
          turn,
          args.sandboxStopped,
        );
        break;
      case "projectChat":
        await finalizeExpiredTurn(
          ctx,
          projectChatAdapter,
          turn,
          args.sandboxStopped,
        );
        break;
    }
    return null;
  },
});

/** How many expired turns one reconciler tick will converge. */
const RECONCILE_BATCH = 25;

/**
 * The single level-triggered reconciler that replaces every per-turn watchdog
 * chain. It runs on a fixed 60s cron rather than being armed by the turn it
 * watches, so a turn whose scheduler entry was never created — or was created
 * and then lost — still converges. Bounded time-to-truth is the guarantee:
 * lease grace plus one tick, whatever killed the owner.
 */
export const reconcile = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const expired = await ctx.runQuery(internal.turns.listExpired, {
      limit: RECONCILE_BATCH,
      now: Date.now(),
    });
    for (const turn of expired) {
      // The probe only chooses the alert wording. It deliberately cannot
      // renew the lease: the old probe touched the streaming row when a pid
      // looked alive, which reset the staleness clock of the very check sent
      // to kill it and let session 53's zombie run indefinitely.
      let sandboxStopped = false;
      if (turn.sandboxId && turn.repoId) {
        const liveness = await ctx.runAction(
          internal.sandbox.verifySandboxLiveness,
          { sandboxId: turn.sandboxId, repoId: turn.repoId },
        );
        sandboxStopped = liveness.reason === "sandbox_not_started";
      }
      await ctx.runMutation(internal.turns.finalizeExpired, {
        turnId: turn.turnId,
        sandboxStopped,
      });
    }
    return null;
  },
});
