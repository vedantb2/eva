import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

type TurnParentId = Doc<"messages">["parentId"];

export type TurnSubmissionSnapshot = Pick<
  Doc<"queuedMessages">,
  | "content"
  | "displayContent"
  | "mode"
  | "model"
  | "reasoningLevel"
  | "thinkingEnabled"
  | "use1mContext"
  | "providerAccountId"
  | "attachmentStorageIds"
  | "personaId"
  | "numDesigns"
>;

export type AcceptedTurnIds = {
  userMessageId: Id<"messages">;
  assistantMessageId: Id<"messages">;
};

export type ExistingTurn =
  | {
      kind: "queued";
      queuedMessageId: Id<"queuedMessages">;
    }
  | {
      kind: "messages";
      userMessageId?: Id<"messages">;
      assistantMessageId?: Id<"messages">;
    };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateClientTurnId(turnId: string): void {
  if (turnId.length > 64 || !UUID_PATTERN.test(turnId)) {
    throw new Error("Invalid turnId: expected a canonical UUID");
  }
}

/** Collision-free canonical request representation used for retry validation. */
export function turnRequestFingerprint(
  snapshot: TurnSubmissionSnapshot,
): string {
  return JSON.stringify([
    snapshot.content,
    snapshot.displayContent ?? null,
    snapshot.mode ?? null,
    snapshot.model ?? null,
    snapshot.reasoningLevel ?? null,
    snapshot.thinkingEnabled ?? null,
    snapshot.use1mContext ?? null,
    snapshot.providerAccountId ?? null,
    (snapshot.attachmentStorageIds ?? []).map(String),
    snapshot.personaId ?? null,
    snapshot.numDesigns ?? null,
  ]);
}

export async function findExistingTurn(
  ctx: MutationCtx,
  parentId: TurnParentId,
  turnId: string,
  fingerprint: string,
): Promise<ExistingTurn | null> {
  const queued = await ctx.db
    .query("queuedMessages")
    .withIndex("by_parent_and_turn", (q) =>
      q.eq("parentId", parentId).eq("turnId", turnId),
    )
    .first();
  if (queued !== null) {
    if (queued.turnRequestFingerprint !== fingerprint) {
      throw new Error("turnId was already used for a different submission");
    }
    return { kind: "queued", queuedMessageId: queued._id };
  }

  const messages = await ctx.db
    .query("messages")
    .withIndex("by_parent_and_turn", (q) =>
      q.eq("parentId", parentId).eq("turnId", turnId),
    )
    .collect();
  if (messages.length === 0) return null;
  const userMessage = messages.find((message) => message.role === "user");
  if (userMessage?.turnRequestFingerprint !== fingerprint) {
    throw new Error("turnId was already used for a different submission");
  }
  const assistantMessage = messages.find(
    (message) => message.role === "assistant",
  );
  return {
    kind: "messages",
    userMessageId: userMessage?._id,
    assistantMessageId: assistantMessage?._id,
  };
}

export async function insertAcceptedTurnMessages(
  ctx: MutationCtx,
  args: {
    parentId: TurnParentId;
    turnId: string;
    fingerprint: string;
    userId: Id<"users">;
    content: string;
    mode?: Doc<"messages">["mode"];
    attachmentStorageIds?: Id<"_storage">[];
    credentialSourceLabel?: string;
    model?: Doc<"messages">["model"];
    reasoningLevel?: Doc<"messages">["reasoningLevel"];
    personaId?: Id<"designPersonas">;
  },
): Promise<AcceptedTurnIds> {
  const now = Date.now();
  const userMessageId = await ctx.db.insert("messages", {
    parentId: args.parentId,
    role: "user",
    content: args.content,
    timestamp: now,
    userId: args.userId,
    mode: args.mode,
    attachmentStorageIds: args.attachmentStorageIds,
    credentialSourceLabel: args.credentialSourceLabel,
    model: args.model,
    reasoningLevel: args.reasoningLevel,
    personaId: args.personaId,
    turnId: args.turnId,
    turnRequestFingerprint: args.fingerprint,
  });
  const assistantMessageId = await ctx.db.insert("messages", {
    parentId: args.parentId,
    role: "assistant",
    content: "",
    timestamp: now + 1,
    mode: args.mode,
    activityLog: "",
    turnId: args.turnId,
  });
  return { userMessageId, assistantMessageId };
}

export async function enqueueAcceptedTurn(
  ctx: MutationCtx,
  args: {
    parentId: TurnParentId;
    turnId: string;
    fingerprint: string;
    userId: Id<"users">;
    snapshot: TurnSubmissionSnapshot;
  },
): Promise<Id<"queuedMessages">> {
  const now = Date.now();
  return await ctx.db.insert("queuedMessages", {
    parentId: args.parentId,
    turnId: args.turnId,
    turnRequestFingerprint: args.fingerprint,
    content: args.snapshot.content,
    displayContent: args.snapshot.displayContent,
    createdAt: now,
    order: now,
    userId: args.userId,
    mode: args.snapshot.mode,
    model: args.snapshot.model,
    reasoningLevel: args.snapshot.reasoningLevel,
    thinkingEnabled: args.snapshot.thinkingEnabled,
    use1mContext: args.snapshot.use1mContext,
    providerAccountId: args.snapshot.providerAccountId,
    attachmentStorageIds: args.snapshot.attachmentStorageIds,
    personaId: args.snapshot.personaId,
    numDesigns: args.snapshot.numDesigns,
  });
}
