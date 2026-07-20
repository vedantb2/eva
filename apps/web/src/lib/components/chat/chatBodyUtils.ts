import { type Doc, type Id } from "@conductor/backend";
import { parseActivitySteps } from "@conductor/shared/parseActivitySteps";
import { tokenizedToEditable } from "@/lib/components/mentions";
import { stripReviewCommentBlocks } from "@/lib/reviewComments";
import {
  collectChangedFiles,
  type ChangedFile,
} from "@/lib/components/chat/ChangedFilesCard";
import { z } from "zod";

export type ChatBodyMessage = Doc<"messages"> & {
  imageUrl?: string | null;
  videoUrl?: string | null;
  attachmentUrls?: (string | null)[];
};

export type ChatBodyQueuedMessage = Doc<"queuedMessages">;

// Boundary schema for the pending-question JSON emitted by the agent. A
// question with any malformed field (or option) is dropped via
// `.catch(null)` + filter, matching the previous per-item guard behaviour.
const questionSchema = z.object({
  question: z.string(),
  header: z.string(),
  multiSelect: z.boolean(),
  options: z.array(z.object({ label: z.string(), description: z.string() })),
});

export type ParsedQuestion = z.infer<typeof questionSchema>;

const pendingQuestionSchema = z.object({
  questions: z.array(questionSchema.nullable().catch(null)),
});

export function parsePendingQuestion(
  raw: string | undefined | null,
): ParsedQuestion[] | null {
  if (!raw) return null;
  try {
    const parsed = pendingQuestionSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;
    const questions = parsed.data.questions.flatMap((q) => (q ? [q] : []));
    return questions.length > 0 ? questions : null;
  } catch {
    return null;
  }
}

/** First name for chat labels; falls back to the first word of full name. */
export function firstNameFromUser(user: {
  firstName?: string | null;
  fullName?: string | null;
}): string | null {
  return user.firstName?.trim() || user.fullName?.trim().split(" ")[0] || null;
}

/** Teammate user turn (not yours). Missing ids → treat as own to avoid layout flash. */
export function isOtherUserChatMessage(
  message: ChatBodyMessage,
  currentUserId: Id<"users"> | undefined,
): boolean {
  return (
    !message.isSystemAlert &&
    message.role === "user" &&
    message.userId !== undefined &&
    currentUserId !== undefined &&
    message.userId !== currentUserId
  );
}

/** Streaming / questions / changed-files flags for an assistant row. */
export function getAssistantTurnState(
  message: ChatBodyMessage,
  isLast: boolean,
): {
  isStreamingPlaceholder: boolean;
  showQuestions: boolean;
  changedFiles: ChangedFile[];
} {
  const isStreamingPlaceholder =
    message.role === "assistant" &&
    !message.content &&
    message.finishedAt === undefined;
  const changedFiles =
    !isStreamingPlaceholder &&
    message.role === "assistant" &&
    message.activityLog
      ? collectChangedFiles(parseActivitySteps(message.activityLog) ?? [])
      : [];
  return {
    isStreamingPlaceholder,
    showQuestions: isStreamingPlaceholder || isLast,
    changedFiles,
  };
}

/** Previously sent user messages as editable display text, newest-first. */
export function buildMessageHistory(messages: ChatBodyMessage[]): string[] {
  return messages
    .filter((m) => m.role === "user" && !m.isSystemAlert && m.content)
    .map(
      (m) =>
        tokenizedToEditable(stripReviewCommentBlocks(m.content ?? "").text)
          .displayText,
    )
    .reverse();
}

/** Index of the latest user message for ChatLastTurn viewport pinning. */
export function findLastUserMessageIndex(messages: ChatBodyMessage[]): number {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message && message.role === "user" && !message.isSystemAlert) {
      return i;
    }
  }
  return -1;
}

/** One tick per user turn for the jump rail. */
export function buildJumpRailTicks(
  messages: ChatBodyMessage[],
): Array<{ id: string; content: string; reply?: string }> {
  const ticks: Array<{ id: string; content: string; reply?: string }> = [];
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    if (!message || message.role !== "user" || message.isSystemAlert) {
      continue;
    }
    let reply: string | undefined;
    for (let j = i + 1; j < messages.length; j++) {
      const next = messages[j];
      if (!next || next.isSystemAlert) continue;
      if (next.role === "user") break;
      if (next.role === "assistant") {
        reply = next.content;
        break;
      }
    }
    ticks.push({
      id: message._id,
      content: message.content,
      ...(reply !== undefined && reply.length > 0 ? { reply } : {}),
    });
  }
  return ticks;
}
