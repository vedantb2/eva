import {
  REASONING_LEVELS,
  type Doc,
  type ReasoningLevel,
} from "@conductor/backend";
import { tokenizedToEditable } from "@/lib/components/mentions";
import { z } from "zod";

export type ChatBodyMessage = Doc<"messages"> & {
  imageUrl?: string | null;
  videoUrl?: string | null;
  attachmentUrls?: (string | null)[];
};

export type ChatBodyQueuedMessage = Doc<"queuedMessages">;

const REASONING_LEVEL_LABELS: Record<ReasoningLevel, string> = {
  off: "Off",
  low: "Low",
  medium: "Medium",
  high: "High",
  max: "Max",
};

export const REASONING_LEVEL_OPTIONS = REASONING_LEVELS.map((value) => ({
  value,
  label: REASONING_LEVEL_LABELS[value],
}));

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

/** Previously sent user messages as editable display text, newest-first. */
export function buildMessageHistory(messages: ChatBodyMessage[]): string[] {
  return messages
    .filter((m) => m.role === "user" && !m.isSystemAlert && m.content)
    .map((m) => tokenizedToEditable(m.content ?? "").displayText)
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
