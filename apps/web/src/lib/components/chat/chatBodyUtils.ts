import { type api, type Id } from "@eva/backend";
import type { FunctionReturnType } from "convex/server";
import { parseActivitySteps } from "@eva/shared/parseActivitySteps";
import {
  collectChangedFiles,
  type ChangedFile,
} from "@/lib/components/chat/ChangedFilesCard";
import { z } from "zod";

type PaginatedMessages = FunctionReturnType<
  typeof api.messages.listByParentPaginated
>;

export type ChatBodyPendingMessage = FunctionReturnType<
  typeof api.messages.listPendingByParent
>[number];

export type ChatBodyMessage =
  | PaginatedMessages["page"][number]
  | ChatBodyPendingMessage;

export type ChatBodyQueuedMessage = FunctionReturnType<
  typeof api.queuedMessages.listByParent
>[number];

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

/** Parses the agent's question payload once at the active-question boundary. */
export function parsePendingQuestion(
  raw: string | undefined | null,
): ParsedQuestion[] | null {
  if (!raw) return null;
  try {
    const parsed = pendingQuestionSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;
    const questions = parsed.data.questions.flatMap((question) =>
      question ? [question] : [],
    );
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

/** Teammate user turn (not yours). Missing ids are treated as own. */
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

/** Streaming and changed-files flags for an already projected assistant row. */
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
