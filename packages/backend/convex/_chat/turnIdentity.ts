import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import {
  PROJECT_CHAT_STREAM_PREFIX,
  TASK_CHAT_STREAM_PREFIX,
} from "./surfaceAdapters";

export type OptionalTurnIdentity = {
  turnId?: string;
  assistantMessageId?: Id<"messages">;
  attempt?: number;
};

export type ExactTurnIdentity = {
  turnId: string;
  assistantMessageId: Id<"messages">;
  attempt: number;
};

type ChatEntity = Doc<"sessions"> | Doc<"projects"> | Doc<"agentTasks">;

/** A v2 identity is all-or-nothing; partial payloads are never trusted. */
export function hasCompleteTurnIdentity(
  identity: OptionalTurnIdentity,
): boolean {
  return (
    identity.turnId !== undefined &&
    identity.assistantMessageId !== undefined &&
    identity.attempt !== undefined
  );
}

export function hasAnyTurnIdentity(identity: OptionalTurnIdentity): boolean {
  return (
    identity.turnId !== undefined ||
    identity.assistantMessageId !== undefined ||
    identity.attempt !== undefined
  );
}

export function exactTurnIdentity(
  identity: OptionalTurnIdentity,
): ExactTurnIdentity | null {
  if (
    identity.turnId === undefined ||
    identity.assistantMessageId === undefined ||
    identity.attempt === undefined
  ) {
    return null;
  }
  return {
    turnId: identity.turnId,
    assistantMessageId: identity.assistantMessageId,
    attempt: identity.attempt,
  };
}

export function turnIdentityMatches(
  expected: OptionalTurnIdentity,
  received: OptionalTurnIdentity,
): boolean {
  const expectedComplete = hasCompleteTurnIdentity(expected);
  const receivedComplete = hasCompleteTurnIdentity(received);
  if (!expectedComplete) return !hasAnyTurnIdentity(received);
  return (
    receivedComplete &&
    expected.turnId === received.turnId &&
    expected.assistantMessageId === received.assistantMessageId &&
    expected.attempt === received.attempt
  );
}

/** Legacy entities accept legacy callbacks; v2 entities require an exact tuple. */
export function callbackMatchesActiveTurn(
  entity: ChatEntity,
  received: OptionalTurnIdentity,
): boolean {
  if (entity.activeTurn === undefined) {
    return !hasAnyTurnIdentity(received);
  }
  return turnIdentityMatches(entity.activeTurn, received);
}

type DatabaseCtx = Pick<QueryCtx, "db"> | Pick<MutationCtx, "db">;

async function getChatEntity(
  ctx: DatabaseCtx,
  table: "sessions" | "projects" | "agentTasks",
  rawId: string,
): Promise<ChatEntity | null> {
  const id = ctx.db.normalizeId(table, rawId);
  if (id === null) return null;
  return await ctx.db.get(id);
}

/** Resolves both callback entity ids and chat-specific streaming ids. */
export async function resolveChatEntity(
  ctx: DatabaseCtx,
  entityId: string,
): Promise<ChatEntity | null> {
  if (entityId.startsWith(PROJECT_CHAT_STREAM_PREFIX)) {
    return await getChatEntity(
      ctx,
      "projects",
      entityId.slice(PROJECT_CHAT_STREAM_PREFIX.length),
    );
  }
  if (entityId.startsWith(TASK_CHAT_STREAM_PREFIX)) {
    return await getChatEntity(
      ctx,
      "agentTasks",
      entityId.slice(TASK_CHAT_STREAM_PREFIX.length),
    );
  }

  const session = await getChatEntity(ctx, "sessions", entityId);
  if (session !== null) return session;
  const project = await getChatEntity(ctx, "projects", entityId);
  if (project !== null) return project;
  return await getChatEntity(ctx, "agentTasks", entityId);
}

/** Non-chat streaming users have no active-turn contract and remain compatible. */
export async function callbackMatchesEntityId(
  ctx: DatabaseCtx,
  entityId: string,
  received: OptionalTurnIdentity,
  eventKind?: string,
): Promise<boolean> {
  const entity = await resolveChatEntity(ctx, entityId);
  const matches =
    entity === null
      ? !hasAnyTurnIdentity(received)
      : callbackMatchesActiveTurn(entity, received);
  if (!matches && eventKind !== undefined) {
    console.log(
      JSON.stringify({
        event: "chat.stale_callback_ignored",
        eventKind,
        entityId,
        expectedTurnId: entity?.activeTurn?.turnId ?? null,
        expectedAssistantMessageId:
          entity?.activeTurn?.assistantMessageId ?? null,
        expectedAttempt: entity?.activeTurn?.attempt ?? null,
        receivedTurnId: received.turnId ?? null,
        receivedAssistantMessageId: received.assistantMessageId ?? null,
        receivedAttempt: received.attempt ?? null,
      }),
    );
  }
  return matches;
}
