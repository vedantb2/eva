import type { ChildProcess } from "child_process";
import type { WriteStream } from "fs";
import type { JsonValue, ProgressStep } from "../types.js";

function parsePriorStep(value: JsonValue): ProgressStep | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const label = value.label;
  const type = value.type;
  if (typeof label !== "string" || typeof type !== "string") {
    return null;
  }
  const detail = value.detail;
  return {
    type,
    label,
    detail: typeof detail === "string" ? detail : undefined,
    status: "complete",
  };
}

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
  activeAttemptChild: ChildProcess | null;
  fatalHeartbeatErrorMessage: string;
  consecutiveHeartbeatFailures: number;
  heartbeatFailureStreakStartedAt: number;
  inFlightToolUses: number;
  codexToolItemIds: Set<string>;
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
  activeAttemptChild: null,
  fatalHeartbeatErrorMessage: "",
  consecutiveHeartbeatFailures: 0,
  heartbeatFailureStreakStartedAt: 0,
  inFlightToolUses: 0,
  codexToolItemIds: new Set<string>(),
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
