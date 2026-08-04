import type { api } from "@eva/backend";
import type { FunctionReturnType } from "convex/server";
import { tokenizedToEditable } from "@/lib/components/mentions";
import { stripReviewCommentBlocks } from "@/lib/reviewComments";
import type { ChatBodyMessage } from "./chatBodyUtils";
import type { ChatActiveTurn } from "./useChatRuntime";

type ConvexStreamingState = NonNullable<
  FunctionReturnType<typeof api.streaming.get>
>;

type ConvexActiveQuestion = NonNullable<
  FunctionReturnType<typeof api.pendingQuestions.getActive>
>;

export type TimelineMessage = Omit<ChatBodyMessage, "_id" | "parentId"> & {
  _id: string;
  parentId: string;
};

type TimelineStreamingState = Omit<
  ConvexStreamingState,
  "assistantMessageId"
> & {
  assistantMessageId?: string;
};

type TimelineActiveQuestion = Omit<
  ConvexActiveQuestion,
  "assistantMessageId" | "questionId"
> & {
  assistantMessageId?: string;
  questionId: string;
};

type TimelineActiveTurn = Omit<ChatActiveTurn, "assistantMessageId"> & {
  assistantMessageId: string;
};

export interface ChatJumpAnchor {
  id: string;
  rowIndex: number;
  content: string;
  reply?: string;
}

export interface CanonicalTimelineRow<
  TMessage extends TimelineMessage = ChatBodyMessage,
> {
  kind: "message";
  id: string;
  message: TMessage;
  precedingUser?: TMessage;
  stream?: TimelineStreamingState;
  question?: TimelineActiveQuestion;
  isLast: boolean;
}

export type ChatTimelineRow<
  TMessage extends TimelineMessage = ChatBodyMessage,
> = CanonicalTimelineRow<TMessage>;

export interface ChatTimelineProjection<
  TMessage extends TimelineMessage = ChatBodyMessage,
> {
  rows: ChatTimelineRow<TMessage>[];
  messageHistory: string[];
  jumpAnchors: ChatJumpAnchor[];
  questionAttached: boolean;
  visitedMessages: number;
}

interface ProjectTimelineArgs<TMessage extends TimelineMessage> {
  messages: ReadonlyArray<TMessage>;
  streaming?: TimelineStreamingState;
  activeQuestion?: TimelineActiveQuestion;
  activeTurn?: TimelineActiveTurn;
}

function logicalMessageId(message: TimelineMessage): string {
  if (message.turnId && !message.isSystemAlert) {
    return `turn:${message.turnId}:${message.role}`;
  }
  return `message:${message._id}`;
}

function exactOwnerMatches(
  owner: {
    turnId?: string;
    assistantMessageId?: string;
    attempt?: number;
  },
  message: TimelineMessage,
  activeTurn: TimelineActiveTurn | undefined,
): boolean {
  return (
    activeTurn !== undefined &&
    message.role === "assistant" &&
    message.turnId !== undefined &&
    owner.turnId === message.turnId &&
    owner.assistantMessageId === message._id &&
    owner.attempt === activeTurn.attempt &&
    owner.turnId === activeTurn.turnId &&
    owner.assistantMessageId === activeTurn.assistantMessageId
  );
}

function editableHistoryEntry(message: TimelineMessage): string | null {
  if (message.role !== "user" || message.isSystemAlert || !message.content) {
    return null;
  }
  return tokenizedToEditable(stripReviewCommentBlocks(message.content).text)
    .displayText;
}

function sameRow<TMessage extends TimelineMessage>(
  left: ChatTimelineRow<TMessage>,
  right: ChatTimelineRow<TMessage>,
): boolean {
  return (
    left.message === right.message &&
    left.precedingUser === right.precedingUser &&
    left.stream === right.stream &&
    left.question === right.question &&
    left.isLast === right.isLast
  );
}

/**
 * Pure chronological projection. The retained row cache is deliberately
 * isolated here: stream tokens replace only their exact assistant row while
 * completed rows preserve object identity for memoized renderers.
 */
export class ChatTimelineProjector<
  TMessage extends TimelineMessage = ChatBodyMessage,
> {
  private previousRows = new Map<string, ChatTimelineRow<TMessage>>();

  project({
    messages,
    streaming,
    activeQuestion,
    activeTurn,
  }: ProjectTimelineArgs<TMessage>): ChatTimelineProjection<TMessage> {
    const nextRows: ChatTimelineRow<TMessage>[] = [];
    const nextRowCache = new Map<string, ChatTimelineRow<TMessage>>();
    const chronologicalHistory: string[] = [];
    const jumpAnchors: ChatJumpAnchor[] = [];
    const userByTurnId = new Map<string, TMessage>();
    const anchorByTurnId = new Map<string, ChatJumpAnchor>();
    let legacyPrecedingUser: TMessage | undefined;
    let legacyAnchor: ChatJumpAnchor | undefined;
    let questionAttached = false;

    for (let index = 0; index < messages.length; index++) {
      const message = messages[index];
      if (!message) continue;

      let precedingUser: TMessage | undefined;
      if (!message.isSystemAlert && message.role === "user") {
        legacyPrecedingUser = message;
        if (message.turnId) userByTurnId.set(message.turnId, message);
        const historyEntry = editableHistoryEntry(message);
        if (historyEntry !== null) chronologicalHistory.push(historyEntry);
        const anchor: ChatJumpAnchor = {
          id: logicalMessageId(message),
          rowIndex: nextRows.length,
          content: message.content,
        };
        jumpAnchors.push(anchor);
        legacyAnchor = anchor;
        if (message.turnId) anchorByTurnId.set(message.turnId, anchor);
      } else if (!message.isSystemAlert && message.role === "assistant") {
        precedingUser = message.turnId
          ? userByTurnId.get(message.turnId)
          : legacyPrecedingUser;
        const anchor = message.turnId
          ? anchorByTurnId.get(message.turnId)
          : legacyAnchor;
        if (anchor && message.content.length > 0) {
          anchor.reply = message.content;
        }
        legacyPrecedingUser = undefined;
        legacyAnchor = undefined;
      }

      const stream =
        streaming && exactOwnerMatches(streaming, message, activeTurn)
          ? streaming
          : undefined;
      const question =
        activeQuestion && exactOwnerMatches(activeQuestion, message, activeTurn)
          ? activeQuestion
          : undefined;
      if (question) questionAttached = true;
      const candidate: CanonicalTimelineRow<TMessage> = {
        kind: "message",
        id: logicalMessageId(message),
        message,
        precedingUser,
        stream,
        question,
        isLast: index === messages.length - 1,
      };
      const previous = this.previousRows.get(candidate.id);
      const row =
        previous && sameRow(previous, candidate) ? previous : candidate;
      nextRows.push(row);
      nextRowCache.set(row.id, row);
    }

    this.previousRows = nextRowCache;
    return {
      rows: nextRows,
      messageHistory: chronologicalHistory.toReversed(),
      jumpAnchors,
      questionAttached,
      visitedMessages: messages.length,
    };
  }
}
