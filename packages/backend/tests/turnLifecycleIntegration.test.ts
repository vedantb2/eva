import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { internal } from "../convex/_generated/api";
import schema from "../convex/schema";
import { openSessionTurn, renewTurnLease } from "../convex/_chat/turnStore";
import { isLegacySessionExecuting } from "../convex/_chat/turnProjection";
import { rollbackQueuedSessionStart } from "../convex/_queues/helpers";
import {
  appendCurrentTurnLease,
  canSendTurnHeartbeat,
  getLeaseTerminalReason,
  noteHeartbeatResponse,
  setCurrentTurnLease,
} from "../callback-src/runtime/turnLease";
import type { JsonObject } from "../callback-src/types";

const modules = import.meta.glob("../convex/**/*.ts");

async function createSessionFixture() {
  const t = convexTest(schema, modules);
  const ids = await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", {});
    const repoId = await ctx.db.insert("githubRepos", {
      owner: "eva",
      name: "turn-lifecycle-test",
      installationId: 1,
    });
    const sessionId = await ctx.db.insert("sessions", {
      repoId,
      userId,
      title: "Lifecycle test",
      status: "active",
    });
    const placeholderMessageId = await ctx.db.insert("messages", {
      parentId: sessionId,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    });
    const turnId = await openSessionTurn(ctx, {
      sessionId,
      streamingEntityId: String(sessionId),
      placeholderMessageId,
      prompt: "hi",
      model: "claude:sonnet",
      repoId,
    });
    return { sessionId, placeholderMessageId, turnId };
  });
  return { t, ...ids };
}

describe("turn lifecycle integration", () => {
  test("opening the first durable Turn permanently marks the session cutover", async () => {
    const { t, sessionId } = await createSessionFixture();
    const session = await t.run(async (ctx) => await ctx.db.get(sessionId));
    expect(session?.turnLifecycleVersion).toBe(2);
  });

  test("an unfenced legacy heartbeat cannot overwrite a durable Turn", async () => {
    const { t, sessionId } = await createSessionFixture();
    await t.run(async (ctx) => {
      await ctx.db.insert("streamingActivity", {
        entityId: String(sessionId),
        currentActivity: "old activity",
        currentContent: "old content",
        lastUpdatedAt: 1,
      });
    });

    const accepted = await t.mutation(internal.turns.legacyHeartbeat, {
      entityId: String(sessionId),
      touchOnly: false,
      currentActivity: "stale activity",
      currentContent: "stale content",
    });

    expect(accepted).toBe(false);
    const streaming = await t.run(async (ctx) =>
      await ctx.db
        .query("streamingActivity")
        .withIndex("by_entity", (q) => q.eq("entityId", String(sessionId)))
        .unique(),
    );
    expect(streaming?.currentActivity).toBe("old activity");
    expect(streaming?.currentContent).toBe("old content");
    expect(streaming?.lastUpdatedAt).toBe(1);
  });

  test("queued workflow start rollback closes its Turn and removes its placeholder", async () => {
    const { t, sessionId, placeholderMessageId, turnId } =
      await createSessionFixture();

    await t.run(
      async (ctx) =>
        await rollbackQueuedSessionStart(ctx, {
          sessionId,
          turnId,
          placeholderMessageId,
        }),
    );

    const rows = await t.run(async (ctx) => ({
      turn: await ctx.db.get(turnId),
      placeholder: await ctx.db.get(placeholderMessageId),
    }));
    expect(rows.turn?.open).toBe(false);
    expect(rows.turn?.state).toBe("error");
    expect(rows.placeholder).toBeNull();
  });

  test("a fresh running lease is not rewritten by a second heartbeat", async () => {
    const { t, turnId } = await createSessionFixture();
    const first = await t.run(async (ctx) => {
      const turn = await ctx.db.get(turnId);
      if (!turn) throw new Error("missing turn");
      return await renewTurnLease(ctx, {
        turnId: String(turnId),
        leaseGeneration: turn.leaseGeneration,
      });
    });
    expect(first.status).toBe("renewed");

    const second = await t.run(async (ctx) => {
      const before = await ctx.db.get(turnId);
      if (!before) throw new Error("missing turn");
      const result = await renewTurnLease(ctx, {
        turnId: String(turnId),
        leaseGeneration: before.leaseGeneration,
      });
      const after = await ctx.db.get(turnId);
      return {
        result,
        leaseExpiresAt: before.leaseExpiresAt,
        afterExpiresAt: after?.leaseExpiresAt,
        afterState: after?.state,
      };
    });

    expect(second.result.status).toBe("renewed");
    expect(second.afterExpiresAt).toBe(second.leaseExpiresAt);
    expect(second.afterState).toBe("running");
  });

  test("a streaming touch within 2s does not rewrite lastUpdatedAt", async () => {
    const { t, sessionId } = await createSessionFixture();
    const entityId = String(sessionId);
    const stamped = await t.run(async (ctx) => {
      const lastUpdatedAt = Date.now();
      await ctx.db.insert("streamingActivity", {
        entityId,
        currentActivity: "[]",
        currentContent: "",
        lastUpdatedAt,
      });
      return lastUpdatedAt;
    });

    await t.mutation(internal.streaming.internalTouch, { entityId });

    const after = await t.run(
      async (ctx) =>
        await ctx.db
          .query("streamingActivity")
          .withIndex("by_entity", (q) => q.eq("entityId", entityId))
          .unique(),
    );
    expect(after?.lastUpdatedAt).toBe(stamped);
  });
});

describe("turn lifecycle rollout", () => {
  test("a cold daemon waits for a claimed lease before heartbeating", () => {
    expect(
      canSendTurnHeartbeat({
        claimMutation: "sessionWorkflow:claimPendingTurn",
        turnLease: null,
      }),
    ).toBe(false);
    expect(
      canSendTurnHeartbeat({
        claimMutation: "sessionWorkflow:claimPendingTurn",
        turnLease: { turnId: "turn-1", leaseGeneration: 1 },
      }),
    ).toBe(true);
    expect(
      canSendTurnHeartbeat({ claimMutation: undefined, turnLease: null }),
    ).toBe(true);
  });

  test("legacy execution fields are consulted only before the durable cutover", () => {
    expect(
      isLegacySessionExecuting({
        activeWorkflowId: "legacy-workflow",
        syntheticTurnMessageId: undefined,
        turnLifecycleVersion: undefined,
      }),
    ).toBe(true);
    expect(
      isLegacySessionExecuting({
        activeWorkflowId: "stale-workflow",
        syntheticTurnMessageId: undefined,
        turnLifecycleVersion: 2,
      }),
    ).toBe(false);
  });

  test("the shared completion helper carries the current lease into fatal payloads", () => {
    setCurrentTurnLease({ turnId: "turn-1", leaseGeneration: 7 });
    const args: JsonObject = { success: false };
    appendCurrentTurnLease(args);
    setCurrentTurnLease(null);
    expect(args).toEqual({
      success: false,
      turnId: "turn-1",
      leaseGeneration: 7,
    });
  });

  test("an authenticated fallback heartbeat propagates a terminal fence", () => {
    setCurrentTurnLease({ turnId: "turn-1", leaseGeneration: 7 });
    expect(
      noteHeartbeatResponse({
        status: "success",
        value: {
          accepted: false,
          lease: { status: "terminal", reason: "superseded" },
        },
      }),
    ).toBe(true);
    expect(getLeaseTerminalReason()).toBe("superseded");
    setCurrentTurnLease(null);
  });
});
