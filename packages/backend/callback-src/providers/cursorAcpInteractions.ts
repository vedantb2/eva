import type {
  RequestPermissionRequest,
  RequestPermissionResponse,
} from "@agentclientprotocol/sdk";
import { z } from "zod";
import { waitForPendingQuestionAnswer } from "../runtime/pendingQuestion.js";
import type { CanonicalEvent, TodoItem } from "../types.js";

const cursorQuestionOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
});

const cursorQuestionSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  options: z.array(cursorQuestionOptionSchema),
  allowMultiple: z.boolean().optional(),
});

export const cursorAskQuestionRequestSchema = z.object({
  toolCallId: z.string(),
  title: z.string().optional(),
  questions: z.array(cursorQuestionSchema),
});

const cursorTodoSchema = z.object({
  id: z.string().optional(),
  content: z.string().optional(),
  title: z.string().optional(),
  status: z.string().optional(),
});

const cursorPlanPhaseSchema = z.object({
  name: z.string(),
  todos: z.array(cursorTodoSchema),
});

export const cursorCreatePlanRequestSchema = z.object({
  toolCallId: z.string(),
  name: z.string().optional(),
  overview: z.string().optional(),
  plan: z.string(),
  todos: z.array(cursorTodoSchema),
  isProject: z.boolean().optional(),
  phases: z.array(cursorPlanPhaseSchema).optional(),
});

export const cursorUpdateTodosRequestSchema = z.object({
  toolCallId: z.string(),
  todos: z.array(cursorTodoSchema),
  merge: z.boolean(),
});

const cursorSubagentTypeSchema = z.union([
  z.enum([
    "unspecified",
    "computer_use",
    "explore",
    "video_review",
    "browser_use",
    "shell",
    "vm_setup_helper",
  ]),
  z.object({ custom: z.string() }),
]);

export const cursorTaskRequestSchema = z.object({
  toolCallId: z.string(),
  description: z.string(),
  prompt: z.string(),
  subagentType: cursorSubagentTypeSchema,
  model: z.string().optional(),
  agentId: z.string().optional(),
  durationMs: z.number().optional(),
});

export const cursorGenerateImageRequestSchema = z.object({
  toolCallId: z.string(),
  description: z.string(),
  filePath: z.string().optional(),
  referenceImagePaths: z.array(z.string()).optional(),
});

export type CursorAskQuestionRequest = z.infer<
  typeof cursorAskQuestionRequestSchema
>;
export type CursorCreatePlanRequest = z.infer<
  typeof cursorCreatePlanRequestSchema
>;
export type CursorUpdateTodosRequest = z.infer<
  typeof cursorUpdateTodosRequestSchema
>;
export type CursorTaskRequest = z.infer<typeof cursorTaskRequestSchema>;
export type CursorGenerateImageRequest = z.infer<
  typeof cursorGenerateImageRequestSchema
>;

function cursorTodoStatus(status: string | undefined): TodoItem["status"] {
  if (status === "completed" || status === "cancelled") return "completed";
  if (status === "in_progress" || status === "inProgress") {
    return "in_progress";
  }
  return "pending";
}

export function cursorTodosToCanonical(
  todos: CursorUpdateTodosRequest["todos"],
): CanonicalEvent[] {
  const mapped: TodoItem[] = todos.flatMap((todo) => {
    const content = todo.content?.trim() || todo.title?.trim() || "";
    return content ? [{ content, status: cursorTodoStatus(todo.status) }] : [];
  });
  return mapped.length > 0 ? [{ kind: "set_todos", todos: mapped }] : [];
}

/** Preserves the legacy --force/--trust policy using semantic option kinds. */
export function autoApproveCursorPermission(
  request: RequestPermissionRequest,
): RequestPermissionResponse {
  const selected =
    request.options.find((option) => option.kind === "allow_always") ??
    request.options.find((option) => option.kind === "allow_once");
  if (!selected) {
    throw new Error(
      "Cursor requested permission without an allow-always or allow-once option",
    );
  }
  return {
    outcome: { outcome: "selected", optionId: selected.optionId },
  };
}

function questionPayload(request: CursorAskQuestionRequest): string {
  return JSON.stringify({
    questions: request.questions.map((question) => ({
      question: question.prompt,
      header: request.title ?? "Question",
      multiSelect: question.allowMultiple === true,
      options: question.options.map((option) => ({
        label: option.label,
        description: option.label,
      })),
    })),
  });
}

function selectedOptionIds(
  selectedLabels: string,
  question: CursorAskQuestionRequest["questions"][number],
): string[] {
  const labels = question.allowMultiple
    ? selectedLabels.split(",").map((label) => label.trim())
    : [selectedLabels.trim()];
  return labels.flatMap((label) => {
    const option = question.options.find(
      (candidate) => candidate.label === label || candidate.id === label,
    );
    return option ? [option.id] : [];
  });
}

export async function answerCursorQuestion(
  request: CursorAskQuestionRequest,
  signal: AbortSignal,
) {
  const answers = await waitForPendingQuestionAnswer(
    request.toolCallId,
    questionPayload(request),
    signal,
  );
  if (answers === null || signal.aborted) {
    return { outcome: { outcome: "cancelled" } };
  }

  const translated = request.questions.flatMap((question) => {
    const selected = answers[question.prompt] ?? "";
    const optionIds = selectedOptionIds(selected, question);
    return optionIds.length > 0
      ? [{ questionId: question.id, selectedOptionIds: optionIds }]
      : [];
  });
  if (translated.length !== request.questions.length) {
    return {
      outcome: {
        outcome: "skipped",
        reason: "No valid option was selected for every Cursor question.",
      },
    };
  }
  return { outcome: { outcome: "answered", answers: translated } };
}

export function acceptCursorPlan(request: CursorCreatePlanRequest): {
  response: { outcome: { outcome: "accepted" } };
  events: CanonicalEvent[];
} {
  const events = cursorTodosToCanonical(request.todos);
  return { response: { outcome: { outcome: "accepted" } }, events };
}

export function cursorTaskToCanonical(
  request: CursorTaskRequest,
): CanonicalEvent[] {
  const subagentType =
    typeof request.subagentType === "string"
      ? request.subagentType
      : request.subagentType.custom;
  const detail = [request.description, subagentType, request.model]
    .filter((part) => typeof part === "string" && part.length > 0)
    .join(" · ");
  return [
    {
      kind: "push_step",
      trackingId: request.toolCallId,
      step: {
        type: "subtask",
        label: "Running agent...",
        detail,
        status: "active",
        toolUseId: request.toolCallId,
      },
    },
    {
      kind: "complete_tool",
      trackingId: request.toolCallId,
      result:
        request.durationMs === undefined
          ? undefined
          : { durationMs: request.durationMs },
    },
  ];
}

export function cursorGeneratedImageToCanonical(
  request: CursorGenerateImageRequest,
): CanonicalEvent[] {
  return [
    {
      kind: "push_step",
      trackingId: request.toolCallId,
      step: {
        type: "write",
        label: "Generating image...",
        detail: request.description,
        status: "active",
        toolUseId: request.toolCallId,
        ...(request.filePath ? { path: request.filePath } : {}),
      },
    },
    {
      kind: "complete_tool",
      trackingId: request.toolCallId,
      result: request.filePath ? { files: [request.filePath] } : undefined,
    },
  ];
}
