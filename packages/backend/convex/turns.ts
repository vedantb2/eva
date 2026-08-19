import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";
import { finalizeStaleChatTurn } from "./_chat/stallWatchdog";
import { sessionChatAdapter } from "./_chat/surfaceAdapters";
import { clearStreamingActivity } from "./_taskWorkflow/helpers";
import { startNextQueuedSessionMessage } from "./_queues/helpers";
import {
  touchStreamingEntity,
  upsertStreamingActivity,
} from "./streaming";
import { authQuery, hasRepoAccess } from "./functions";
import {
  acquireTurnLease,
  advanceTurn,
  closeTurn,
  findOpenSessionTurn,
  renewTurnLease,
} from "./_chat/turnStore";
import { turnStateValidator } from "./_validators/tableFields";

const sessionTurnStatusValidator = v.object({
  turnId: v.id("turns"),
  state: turnStateValidator,
  startedAt: v.number(),
  leaseExpiresAt: v.number(),
  placeholderMessageId: v.optional(v.id("messages")),
});

/** Canonical UI projection for whether one session turn is open. */
export const getSessionStatus = authQuery({
  args: { sessionId: v.id("sessions") },
  returns: v.union(sessionTurnStatusValidator, v.null()),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) return null;
    if (!(await hasRepoAccess(ctx.db, session.repoId, ctx.userId))) return null;
    const turn = await findOpenSessionTurn(ctx, args.sessionId);
    if (!turn) return null;
    return {
      turnId: turn._id,
      state: turn.state,
      startedAt: turn.turnStartedAt,
      leaseExpiresAt: turn.leaseExpiresAt,
      placeholderMessageId: turn.placeholderMessageId,
    };
  },
});

const leaseIdentityValidator = v.object({
  turnId: v.id("turns"),
  leaseGeneration: v.number(),
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

/** Renews the exact lease generation presented by a sandbox runner. */
export const renew = internalMutation({
  args: {
    turnId: v.string(),
    leaseGeneration: v.number(),
    streamingEntityId: v.optional(v.string()),
  },
  returns: leaseVerdictValidator,
  handler: async (ctx, args) => await renewTurnLease(ctx, args),
});

/** Atomically renews a fenced lease and writes only for its current owner. */
export const heartbeat = internalMutation({
  args: {
    turnId: v.string(),
    leaseGeneration: v.number(),
    entityId: v.string(),
    touchOnly: v.boolean(),
    currentActivity: v.optional(v.string()),
    currentContent: v.optional(v.string()),
    pendingQuestion: v.optional(v.string()),
  },
  returns: leaseVerdictValidator,
  handler: async (ctx, args) => {
    const lease = await renewTurnLease(ctx, {
      turnId: args.turnId,
      leaseGeneration: args.leaseGeneration,
      streamingEntityId: args.entityId,
    });
    if (lease.status === "terminal") return lease;
    if (args.touchOnly) {
      await touchStreamingEntity(ctx, args.entityId);
    } else {
      await upsertStreamingActivity(ctx, {
        entityId: args.entityId,
        currentActivity: args.currentActivity ?? "[]",
        currentContent: args.currentContent,
        pendingQuestion: args.pendingQuestion,
      });
    }
    return lease;
  },
});

/** Records that durable sandbox preparation has reached the launch phase. */
export const markLaunching = internalMutation({
  args: {
    turnId: v.id("turns"),
    sandboxId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const turn = await ctx.db.get(args.turnId);
    if (turn) await advanceTurn(ctx, turn, "launching", args);
    return null;
  },
});

/** Gives a one-shot runner its fenced lease immediately before process launch. */
export const acquireOneShotLease = internalMutation({
  args: {
    turnId: v.id("turns"),
    sandboxId: v.string(),
  },
  returns: v.union(leaseIdentityValidator, v.null()),
  handler: async (ctx, args) => {
    const turn = await ctx.db.get(args.turnId);
    if (!turn) return null;
    return await acquireTurnLease(ctx, turn, "running", args);
  },
});

/** Open turns whose owner lease has expired. */
export const listExpired = internalQuery({
  args: { now: v.number(), limit: v.number() },
  returns: v.array(
    v.object({
      turnId: v.id("turns"),
      sandboxId: v.optional(v.string()),
      repoId: v.id("githubRepos"),
    }),
  ),
  handler: async (ctx, args) => {
    const turns = await ctx.db
      .query("turns")
      .withIndex("by_open_lease", (q) =>
        q.eq("open", true).lt("leaseExpiresAt", args.now),
      )
      .take(args.limit);
    return turns.map((turn) => ({
      turnId: turn._id,
      sandboxId: turn.sandboxId,
      repoId: turn.repoId,
    }));
  },
});

/** Re-reads and converges one expired lease; a concurrent renewal always wins. */
export const finalizeExpired = internalMutation({
  args: {
    turnId: v.id("turns"),
    sandboxStopped: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const turn = await ctx.db.get(args.turnId);
    if (!turn || !turn.open || turn.leaseExpiresAt >= Date.now()) return null;
    const sessionId = ctx.db.normalizeId("sessions", turn.entityId);
    const session = sessionId ? await ctx.db.get(sessionId) : null;
    const staleSeconds = Math.max(
      1,
      Math.round((Date.now() - turn.leaseExpiresAt) / 1000),
    );
    const alert = args.sandboxStopped
      ? sessionChatAdapter.alerts.sandboxStopped(staleSeconds)
      : sessionChatAdapter.alerts.stalled(staleSeconds, turn.state, 120);
    if (sessionId && session && turn.workflowId !== undefined) {
      await finalizeStaleChatTurn(
        ctx,
        sessionChatAdapter,
        sessionId,
        session,
        turn.workflowId,
        alert,
        { sandboxStopped: args.sandboxStopped },
      );
    } else if (sessionId && session && turn.placeholderMessageId !== undefined) {
      const message = await ctx.db.get(turn.placeholderMessageId);
      if (message && message.finishedAt === undefined) {
        await ctx.db.patch(message._id, {
          content: alert.text,
          finishedAt: Date.now(),
        });
      }
      await clearStreamingActivity(ctx, turn.streamingEntityId);
      await ctx.db.patch(sessionId, {
        syntheticTurnMessageId: undefined,
        updatedAt: Date.now(),
      });
      await startNextQueuedSessionMessage(ctx, sessionId);
    }
    await closeTurn(ctx, turn, "error", { error: alert.text });
    return null;
  },
});

const RECONCILE_BATCH_SIZE = 25;

/** Level-triggered convergence for owners that die without sending completion. */
export const reconcile = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const expired = await ctx.runQuery(internal.turns.listExpired, {
      now: Date.now(),
      limit: RECONCILE_BATCH_SIZE,
    });
    for (const turn of expired) {
      let sandboxStopped = false;
      if (turn.sandboxId) {
        const liveness = await ctx.runAction(
          internal.sandbox.verifySandboxLiveness,
          {
            sandboxId: turn.sandboxId,
            repoId: turn.repoId,
          },
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
