import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import {
  internalMutation,
  internalQuery,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { authQuery, authMutation } from "./functions";
import { cancelledMessageOutcome } from "./_chat/cancelledMessage";
import { optionalChatTurnIdentityFields } from "./_validators/tableFields";
import {
  callbackMatchesEntityId,
  turnIdentityMatches,
  type OptionalTurnIdentity,
} from "./_chat/turnIdentity";

/**
 * Finalize an in-flight assistant message after the user hits stop.
 * Keeps whatever streamed text / tool timeline exists; deletes the bubble when
 * nothing was produced (avoids leaving "Execution cancelled by user.").
 */
export async function finalizeCancelledAssistantMessage(
  ctx: MutationCtx,
  message: Doc<"messages">,
  streaming: Doc<"streamingActivity"> | null,
): Promise<void> {
  const outcome = cancelledMessageOutcome(message, streaming);
  if (outcome.kind === "skip") return;
  if (outcome.kind === "delete") {
    await ctx.db.delete(message._id);
    return;
  }
  await ctx.db.patch(message._id, {
    ...(outcome.content !== undefined ? { content: outcome.content } : {}),
    ...(outcome.activityLog !== undefined
      ? { activityLog: outcome.activityLog }
      : {}),
    finishedAt: Date.now(),
  });
}

const activityStateValidator = v.union(
  v.object({
    currentActivity: v.string(),
    currentContent: v.string(),
    pendingQuestion: v.optional(v.string()),
    ...optionalChatTurnIdentityFields,
  }),
  v.null(),
);

const setArgs = {
  entityId: v.string(),
  currentActivity: v.string(),
  currentContent: v.optional(v.string()),
  pendingQuestion: v.optional(v.string()),
  ...optionalChatTurnIdentityFields,
};

const httpTurnIdentityArgs = {
  turnId: v.optional(v.string()),
  assistantMessageId: v.optional(v.string()),
  attempt: v.optional(v.number()),
};

function normalizeHttpTurnIdentity(
  ctx: MutationCtx,
  args: {
    turnId?: string;
    assistantMessageId?: string;
    attempt?: number;
  },
): OptionalTurnIdentity | null {
  if (args.assistantMessageId === undefined) {
    return { turnId: args.turnId, attempt: args.attempt };
  }
  const assistantMessageId = ctx.db.normalizeId(
    "messages",
    args.assistantMessageId,
  );
  if (assistantMessageId === null) return null;
  return {
    turnId: args.turnId,
    assistantMessageId,
    attempt: args.attempt,
  };
}

async function readStreamingActivity(ctx: QueryCtx, entityId: string) {
  const streaming = await ctx.db
    .query("streamingActivity")
    .withIndex("by_entity", (q) => q.eq("entityId", entityId))
    .first();
  if (!streaming) return null;
  return {
    currentActivity: streaming.currentActivity,
    currentContent: streaming.currentContent ?? "",
    pendingQuestion: streaming.pendingQuestion,
    turnId: streaming.turnId,
    assistantMessageId: streaming.assistantMessageId,
    attempt: streaming.attempt,
  };
}

/** Updates or creates streaming activity state for an entity, only writing on actual changes. */
async function upsertStreamingActivity(
  ctx: MutationCtx,
  args: {
    entityId: string;
    currentActivity: string;
    currentContent?: string;
    pendingQuestion?: string;
    turnId?: string;
    assistantMessageId?: Id<"messages">;
    attempt?: number;
  },
): Promise<void> {
  if (!(await callbackMatchesEntityId(ctx, args.entityId, args))) return;
  const existing = await ctx.db
    .query("streamingActivity")
    .withIndex("by_entity", (q) => q.eq("entityId", args.entityId))
    .first();
  const now = Date.now();
  const nextContent = args.currentContent ?? "";
  if (existing) {
    const activityChanged = existing.currentActivity !== args.currentActivity;
    const contentChanged = (existing.currentContent ?? "") !== nextContent;
    const questionChanged =
      (existing.pendingQuestion ?? "") !== (args.pendingQuestion ?? "");
    const identityChanged =
      existing.turnId !== args.turnId ||
      existing.assistantMessageId !== args.assistantMessageId ||
      existing.attempt !== args.attempt;
    if (
      activityChanged ||
      contentChanged ||
      questionChanged ||
      identityChanged
    ) {
      await ctx.db.patch(existing._id, {
        currentActivity: args.currentActivity,
        currentContent: nextContent,
        pendingQuestion: args.pendingQuestion,
        turnId: args.turnId,
        assistantMessageId: args.assistantMessageId,
        attempt: args.attempt,
        lastUpdatedAt: now,
      });
    } else {
      await ctx.db.patch(existing._id, {
        lastUpdatedAt: now,
      });
    }
  } else {
    await ctx.db.insert("streamingActivity", {
      entityId: args.entityId,
      currentActivity: args.currentActivity,
      currentContent: nextContent,
      pendingQuestion: args.pendingQuestion,
      turnId: args.turnId,
      assistantMessageId: args.assistantMessageId,
      attempt: args.attempt,
      lastUpdatedAt: now,
    });
  }
}

/** Gets the current streaming activity state for an entity (task, session, etc.). */
export const get = authQuery({
  args: { entityId: v.string() },
  returns: activityStateValidator,
  handler: async (ctx, args) => readStreamingActivity(ctx, args.entityId),
});

/** Updates or creates streaming activity state for an entity, only writing on actual changes. */
export const set = authMutation({
  args: setArgs,
  returns: v.null(),
  handler: async (ctx, args) => {
    await upsertStreamingActivity(ctx, args);
    return null;
  },
});

/** Gets streaming activity state (internal use, no auth check). */
export const internalGet = internalQuery({
  args: { entityId: v.string() },
  returns: activityStateValidator,
  handler: async (ctx, args) => readStreamingActivity(ctx, args.entityId),
});

async function touchStreamingEntity(
  ctx: MutationCtx,
  entityId: string,
  identity: OptionalTurnIdentity,
): Promise<boolean> {
  if (!(await callbackMatchesEntityId(ctx, entityId, identity))) return false;
  const now = Date.now();
  const existing = await ctx.db
    .query("streamingActivity")
    .withIndex("by_entity", (q) => q.eq("entityId", entityId))
    .first();
  if (!existing) {
    await ctx.db.insert("streamingActivity", {
      entityId,
      currentActivity: "[]",
      currentContent: "",
      ...identity,
      lastUpdatedAt: now,
    });
    return true;
  }
  await ctx.db.patch(existing._id, { lastUpdatedAt: now });
  return true;
}

/** Bumps lastUpdatedAt only — used for lightweight watchdog heartbeats (callback token). */
export const touch = authMutation({
  args: { entityId: v.string(), ...optionalChatTurnIdentityFields },
  returns: v.boolean(),
  handler: async (ctx, args) => touchStreamingEntity(ctx, args.entityId, args),
});

/** Internal touch for HTTP heartbeat route and liveness probe refresh. */
export const internalTouch = internalMutation({
  args: { entityId: v.string(), ...optionalChatTurnIdentityFields },
  returns: v.boolean(),
  handler: async (ctx, args) => touchStreamingEntity(ctx, args.entityId, args),
});

/** HMAC route adapter: validates the string id before entering the typed core. */
export const internalTouchFromHttp = internalMutation({
  args: { entityId: v.string(), ...httpTurnIdentityArgs },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const identity = normalizeHttpTurnIdentity(ctx, args);
    if (identity === null) return false;
    return await touchStreamingEntity(ctx, args.entityId, identity);
  },
});

/** Updates or creates streaming activity state (internal use, no auth check). */
export const internalSet = internalMutation({
  args: setArgs,
  returns: v.null(),
  handler: async (ctx, args) => {
    await upsertStreamingActivity(ctx, args);
    return null;
  },
});

/** HMAC route adapter: validates the string id before entering the typed core. */
export const internalSetFromHttp = internalMutation({
  args: {
    entityId: v.string(),
    currentActivity: v.string(),
    currentContent: v.optional(v.string()),
    pendingQuestion: v.optional(v.string()),
    ...httpTurnIdentityArgs,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = normalizeHttpTurnIdentity(ctx, args);
    if (identity === null) return null;
    await upsertStreamingActivity(ctx, {
      entityId: args.entityId,
      currentActivity: args.currentActivity,
      currentContent: args.currentContent,
      pendingQuestion: args.pendingQuestion,
      ...identity,
    });
    return null;
  },
});

/** Removes the streaming activity record for an entity. */
export const clear = authMutation({
  args: { entityId: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("streamingActivity")
      .withIndex("by_entity", (q) => q.eq("entityId", args.entityId))
      .first();
    if (existing) await ctx.db.delete(existing._id);
    return null;
  },
});

/** Deletes only the stream row owned by the expected turn tuple. */
export async function clearStreamingActivityForTurn(
  ctx: MutationCtx,
  entityId: string,
  expected: OptionalTurnIdentity,
): Promise<boolean> {
  const existing = await ctx.db
    .query("streamingActivity")
    .withIndex("by_entity", (q) => q.eq("entityId", entityId))
    .first();
  if (existing === null || !turnIdentityMatches(existing, expected)) {
    return false;
  }
  await ctx.db.delete(existing._id);
  return true;
}
