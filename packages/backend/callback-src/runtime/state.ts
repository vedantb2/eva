import type { ChildProcess } from "child_process";
import type { WriteStream } from "fs";
import type { JsonValue, ProgressStep, TodoItem } from "../types.js";

function parsePriorStep(value: JsonValue): ProgressStep | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const label = value.label;
  const type = value.type;
  if (typeof label !== "string" || typeof type !== "string") {
    return null;
  }
  if (type === "thinking" || type === "reasoning" || type === "response") {
    return null;
  }
  const detail = value.detail;
  const path = value.path;
  const step: ProgressStep = {
    type,
    label,
    detail: typeof detail === "string" ? detail : undefined,
    path: typeof path === "string" ? path : undefined,
    status: "complete",
  };
  if (typeof value.toolUseId === "string" && value.toolUseId.trim()) {
    step.toolUseId = value.toolUseId.trim();
  }
  if (
    typeof value.parentToolUseId === "string" &&
    value.parentToolUseId.trim()
  ) {
    step.parentToolUseId = value.parentToolUseId.trim();
  }
  if (typeof value.command === "string" && value.command) {
    step.command = value.command;
  }
  if (typeof value.contentPreview === "string" && value.contentPreview) {
    step.contentPreview = value.contentPreview;
  }
  if (value.isError === true) {
    step.isError = true;
  }
  if (
    typeof value.durationMs === "number" &&
    Number.isFinite(value.durationMs)
  ) {
    step.durationMs = value.durationMs;
  }
  if (
    value.output &&
    typeof value.output === "object" &&
    !Array.isArray(value.output) &&
    typeof value.output.text === "string"
  ) {
    step.output = {
      text: value.output.text,
      exitCode:
        typeof value.output.exitCode === "number"
          ? value.output.exitCode
          : undefined,
      truncated: value.output.truncated === true ? true : undefined,
    };
  }
  if (Array.isArray(value.edits)) {
    const edits: NonNullable<ProgressStep["edits"]> = [];
    for (const edit of value.edits) {
      if (!edit || typeof edit !== "object" || Array.isArray(edit)) continue;
      if (
        typeof edit.oldText !== "string" ||
        typeof edit.newText !== "string"
      ) {
        continue;
      }
      edits.push({ oldText: edit.oldText, newText: edit.newText });
    }
    if (edits.length > 0) {
      step.edits = edits;
    }
  }
  if (Array.isArray(value.files)) {
    const files: string[] = [];
    for (const file of value.files) {
      if (typeof file === "string" && file.trim()) {
        files.push(file.trim());
      }
    }
    if (files.length > 0) {
      step.files = files;
    }
  }
  if (Array.isArray(value.todos)) {
    const todos: TodoItem[] = [];
    for (const item of value.todos) {
      if (!item || typeof item !== "object" || Array.isArray(item)) continue;
      if (typeof item.content !== "string" || !item.content) continue;
      const status =
        item.status === "in_progress" || item.status === "completed"
          ? item.status
          : "pending";
      todos.push({ content: item.content, status });
    }
    if (todos.length > 0) {
      step.todos = todos;
    }
  }
  return step;
}

export const parsePriorStepForTest = parsePriorStep;

type ClaudeSessionMode = "none" | "session" | "resume";

type CallbackState = {
  accumulatedSteps: ProgressStep[];
  pendingQuestionData: string;
  lastStepType: string;
  rawOutput: string;
  rawLogStream: WriteStream | null;
  rawLogStreamFailed: boolean;
  rawLogBytesWritten: number;
  lastProcessed: number;
  lastStreamingSentAt: number;
  lastSentPayload: string;
  lastSentContent: string;
  parsedStreamEventCount: number;
  realtimeOutputBuffer: string;
  activeClaudeSessionId: string;
  activeCodexThreadId: string;
  activeOpencodeSessionId: string;
  opencodeFinalMessageId: string;
  activeCursorSessionId: string;
  resultEventSeen: boolean;
  activeClaudeSessionMode: ClaudeSessionMode;
  waitingForFirstAssistantEvent: boolean;
  claudeInitAt: number;
  activeAttemptStartedAt: number;
  firstAssistantEventAt: number;
  firstTextBlockAt: number;
  currentStreamedContent: string;
  streamedAssistantTextThisMessage: boolean;
  /** Set at each assistant message boundary (message_start) so the next text
   * append inserts a paragraph break instead of butting one message's last
   * sentence against the next's first word ("design.Design settled."). */
  pendingParagraphBreak: boolean;
  activeAttemptChild: ChildProcess | null;
  fatalHeartbeatErrorMessage: string;
  consecutiveHeartbeatFailures: number;
  heartbeatFailureStreakStartedAt: number;
  inFlightToolUses: number;
  codexToolItemIds: Set<string>;
  /** Current todo checklist for this turn, rebuilt from TodoWrite/TaskCreate/
   * TaskUpdate calls and mirrored into the single "todos" activity step. */
  todoState: TodoItem[];
  /** True while a turn is paused inside canUseTool waiting for the user's answer
   * to a blocking AskUserQuestion. Suspends the per-turn watchdog so a genuinely
   * waiting turn is never killed for producing no SDK messages. */
  awaitingQuestionAnswer: boolean;
  doneFileWritten: boolean;
  flushInProgress: boolean;
  pingInProgress: boolean;
  pingStartedAt: number;
  callbackReady: boolean;
  streamingLoopsStopped: boolean;
  stderrOutput: string;
};

/** Single mutable runtime bag — ESM-safe cross-module mutations. */
export const callbackState: CallbackState = {
  accumulatedSteps: [],
  pendingQuestionData: "",
  lastStepType: "",
  rawOutput: "",
  rawLogStream: null,
  rawLogStreamFailed: false,
  rawLogBytesWritten: 0,
  lastProcessed: 0,
  lastStreamingSentAt: Date.now(),
  lastSentPayload: "",
  lastSentContent: "",
  parsedStreamEventCount: 0,
  realtimeOutputBuffer: "",
  activeClaudeSessionId: process.env.CLAUDE_SESSION_ID || "",
  activeCodexThreadId: "",
  activeOpencodeSessionId: "",
  opencodeFinalMessageId: "",
  activeCursorSessionId: "",
  resultEventSeen: false,
  activeClaudeSessionMode: "none",
  waitingForFirstAssistantEvent: false,
  claudeInitAt: 0,
  activeAttemptStartedAt: 0,
  firstAssistantEventAt: 0,
  firstTextBlockAt: 0,
  currentStreamedContent: "",
  streamedAssistantTextThisMessage: false,
  pendingParagraphBreak: false,
  activeAttemptChild: null,
  fatalHeartbeatErrorMessage: "",
  consecutiveHeartbeatFailures: 0,
  heartbeatFailureStreakStartedAt: 0,
  inFlightToolUses: 0,
  codexToolItemIds: new Set<string>(),
  todoState: [],
  awaitingQuestionAnswer: false,
  doneFileWritten: false,
  flushInProgress: false,
  pingInProgress: false,
  pingStartedAt: 0,
  callbackReady: false,
  streamingLoopsStopped: false,
  stderrOutput: "",
};

try {
  const priorRaw = process.env.PRIOR_STEPS;
  if (priorRaw) {
    const prior: JsonValue = JSON.parse(priorRaw);
    if (Array.isArray(prior)) {
      for (const s of prior) {
        const step = parsePriorStep(s);
        if (step) callbackState.accumulatedSteps.push(step);
      }
    }
  }
} catch {
  /* ignore invalid PRIOR_STEPS */
}

export function shiftLastProcessed(trimAmount: number): void {
  callbackState.lastProcessed = Math.max(
    0,
    callbackState.lastProcessed - trimAmount,
  );
}

export function appendRawOutputChunk(text: string): void {
  callbackState.rawOutput += text;
}

export function trimRawOutputHead(maxBytes: number): number {
  if (callbackState.rawOutput.length <= maxBytes) return 0;
  const trimAmount = callbackState.rawOutput.length - maxBytes;
  callbackState.rawOutput = callbackState.rawOutput.slice(trimAmount);
  return trimAmount;
}

export function incrementRawLogBytesWritten(n: number): void {
  callbackState.rawLogBytesWritten += n;
}

export function setRawLogStreamFailed(value: boolean): void {
  callbackState.rawLogStreamFailed = value;
}

export function assignRawLogStream(stream: WriteStream | null): void {
  callbackState.rawLogStream = stream;
}

/** @internal test-only state resets */
export function resetStateForTests(): void {
  callbackState.accumulatedSteps.length = 0;
  callbackState.lastStepType = "";
  callbackState.pendingQuestionData = "";
  callbackState.fatalHeartbeatErrorMessage = "";
  callbackState.inFlightToolUses = 0;
  callbackState.firstTextBlockAt = 0;
  callbackState.waitingForFirstAssistantEvent = false;
  callbackState.claudeInitAt = 0;
  callbackState.resultEventSeen = false;
  callbackState.parsedStreamEventCount = 0;
  callbackState.currentStreamedContent = "";
  callbackState.streamedAssistantTextThisMessage = false;
  callbackState.pendingParagraphBreak = false;
  callbackState.todoState.length = 0;
  callbackState.awaitingQuestionAnswer = false;
}

export function setFatalHeartbeatForTest(message: string): void {
  callbackState.fatalHeartbeatErrorMessage = message;
}

export function setInFlightToolUsesForTest(n: number): void {
  callbackState.inFlightToolUses = n;
}

export function getPendingQuestionForTest(): string {
  return callbackState.pendingQuestionData;
}

export const accumulatedSteps = callbackState.accumulatedSteps;
