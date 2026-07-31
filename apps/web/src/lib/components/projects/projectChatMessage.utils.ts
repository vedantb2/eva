import { projectConversationMessageKey, type api } from "@eva/backend";
import type { FunctionReturnType } from "convex/server";
import { z } from "zod";

type ProjectWithDetails = NonNullable<
  FunctionReturnType<typeof api.projects.get>
>;

export type ProjectConversationMessage =
  ProjectWithDetails["conversationHistory"][number];

const optionSchema = z.object({
  label: z.string(),
  description: z.string(),
});

const questionSchema = z.object({
  question: z.string(),
  options: z.array(optionSchema),
});

const transitionSchema = z.union([
  z.object({ interviewComplete: z.literal(true) }),
  z.object({ ready: z.literal(true) }),
]);

const specSchema = z.object({
  title: z.string(),
  tasks: z.array(z.object({}).passthrough()),
});

const storedObjectSchema = z.object({}).passthrough();

export type ProjectInterviewQuestion = z.infer<typeof questionSchema>;

type StoredContent =
  | { kind: "question"; question: ProjectInterviewQuestion }
  | { kind: "transition" }
  | { kind: "spec"; title: string; taskCount: number }
  | { kind: "plain" };

export type ProjectInterviewRow =
  | {
      kind: "message";
      id: string;
      role: "user" | "assistant";
      content: string;
      activityLog?: string;
      userId?: ProjectConversationMessage["userId"];
      startedAt?: number;
      finishedAt?: number;
    }
  | {
      kind: "question";
      id: string;
      question: ProjectInterviewQuestion;
      activityLog?: string;
      startedAt?: number;
      finishedAt?: number;
    }
  | {
      kind: "streaming";
      id: string;
      startedAt?: number;
    }
  | {
      kind: "transition";
      id: string;
      activityLog?: string;
      startedAt?: number;
      finishedAt?: number;
    }
  | {
      kind: "spec";
      id: string;
      title: string;
      taskCount: number;
      activityLog?: string;
      startedAt?: number;
      finishedAt?: number;
    };

export interface ProjectInterviewProjection {
  rows: ProjectInterviewRow[];
  activeQuestion?: ProjectInterviewQuestion & { id: string };
  questionCount: number;
  lastRole?: "user" | "assistant";
  hasEmptyAssistant: boolean;
}

function parseStoredContent(content: string): StoredContent {
  let parsed: z.infer<typeof storedObjectSchema>;
  try {
    const result = storedObjectSchema.safeParse(JSON.parse(content));
    if (!result.success) return { kind: "plain" };
    parsed = result.data;
  } catch {
    return { kind: "plain" };
  }

  const question = questionSchema.safeParse(parsed);
  if (question.success) return { kind: "question", question: question.data };
  if (transitionSchema.safeParse(parsed).success) return { kind: "transition" };
  const spec = specSchema.safeParse(parsed);
  if (spec.success) {
    return {
      kind: "spec",
      title: spec.data.title,
      taskCount: spec.data.tasks.length,
    };
  }
  return { kind: "plain" };
}

/** Parses each stored event once and projects the interview-specific rows. */
export function projectProjectInterview(
  messages: ReadonlyArray<ProjectConversationMessage>,
): ProjectInterviewProjection {
  const rows: ProjectInterviewRow[] = [];
  const pendingTransitionLogs: string[] = [];
  let activeQuestion: ProjectInterviewProjection["activeQuestion"];
  let questionCount = 0;
  let hasEmptyAssistant = false;

  for (const message of messages) {
    const id = projectConversationMessageKey(
      message.id,
      message.role,
      message.startedAt,
      message.finishedAt,
      message.content,
    );
    if (message.role === "user") {
      pendingTransitionLogs.length = 0;
      activeQuestion = undefined;
      rows.push({
        kind: "message",
        id,
        role: "user",
        content: message.content,
        userId: message.userId,
        startedAt: message.startedAt,
      });
      continue;
    }

    if (message.content.length === 0) {
      hasEmptyAssistant = true;
      activeQuestion = undefined;
      rows.push({ kind: "streaming", id, startedAt: message.startedAt });
      continue;
    }

    const content = parseStoredContent(message.content);
    if (content.kind === "question") {
      pendingTransitionLogs.length = 0;
      questionCount += 1;
      activeQuestion = { id, ...content.question };
      rows.push({
        kind: "question",
        id,
        question: content.question,
        activityLog: message.activityLog,
        startedAt: message.startedAt,
        finishedAt: message.finishedAt,
      });
      continue;
    }
    activeQuestion = undefined;

    if (content.kind === "transition") {
      if (message.activityLog) pendingTransitionLogs.push(message.activityLog);
      rows.push({
        kind: "transition",
        id,
        activityLog: message.activityLog,
        startedAt: message.startedAt,
        finishedAt: message.finishedAt,
      });
      continue;
    }

    if (content.kind === "spec") {
      while (rows.at(-1)?.kind === "transition") rows.pop();
      const logs = [...pendingTransitionLogs];
      if (message.activityLog) logs.push(message.activityLog);
      pendingTransitionLogs.length = 0;
      rows.push({
        kind: "spec",
        id,
        title: content.title || "Untitled plan",
        taskCount: content.taskCount,
        activityLog: logs.length > 0 ? logs.join("\n\n") : undefined,
        startedAt: message.startedAt,
        finishedAt: message.finishedAt,
      });
      continue;
    }

    pendingTransitionLogs.length = 0;
    rows.push({
      kind: "message",
      id,
      role: "assistant",
      content: message.content,
      activityLog: message.activityLog,
      startedAt: message.startedAt,
      finishedAt: message.finishedAt,
    });
  }

  return {
    rows,
    activeQuestion,
    questionCount,
    lastRole: messages.at(-1)?.role,
    hasEmptyAssistant,
  };
}
