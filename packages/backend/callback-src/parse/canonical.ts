import {
  completedLabels,
  NON_SHELL_TOOL_TIMEOUT_MS,
  PROVIDER,
  SHELL_TOOL_TIMEOUT_MS,
} from "../config.js";
import { claudeParseLine } from "../providers/claude.js";
import { codexParseLine } from "../providers/codex.js";
import { cursorParseLine } from "../providers/cursor.js";
import { opencodeParseLine } from "../providers/opencode.js";
import { callbackState as S } from "../runtime/state.js";
import type { CanonicalEvent, JsonObject, ProgressStep } from "../types.js";
import { tryParseJson } from "../utils.js";

export {
  codexItemToStep,
  cursorToolToStep,
  getCodexAgentMessageText,
  getCodexFieldValue,
  getCodexThreadId,
  opencodeToolToStep,
  toolCallToStep,
} from "./toolSteps.js";

/** Marks the last accumulated step as complete and updates its label. */
export function markLastComplete(): void {
  if (S.accumulatedSteps.length === 0) return;
  const last = S.accumulatedSteps[S.accumulatedSteps.length - 1];
  last.status = "complete";
  if (completedLabels[last.label]) {
    last.label = completedLabels[last.label];
  } else if (last.label.startsWith("Using ") && last.label.endsWith("...")) {
    last.label = "Used " + last.label.slice(6, -3);
  }
}

/** Updates or adds a thinking step in the accumulated steps list. */
export function updateThinkingStep(label: string, detail?: string): void {
  const lastStep = S.accumulatedSteps[S.accumulatedSteps.length - 1];
  if (lastStep && lastStep.type === "thinking" && lastStep.label === label) {
    lastStep.status = "active";
    lastStep.type = "thinking";
    lastStep.detail = detail;
    S.lastStepType = "thinking";
    return;
  }
  markLastComplete();
  S.accumulatedSteps.push({
    type: "thinking",
    label,
    detail,
    status: "active",
  });
  S.lastStepType = "thinking";
}

/** Provider-specific canonical events via adapter parseLine. */
export function parseToCanonical(
  event: JsonObject,
  provider: string = PROVIDER,
): CanonicalEvent[] {
  if (provider === "cursor") return cursorParseLine(event);
  if (provider === "opencode") return opencodeParseLine(event);
  if (provider === "codex") return codexParseLine(event);
  return claudeParseLine(event);
}

/** Applies canonical events to module state. */
export function applyCanonicalEvents(events: CanonicalEvent[]): boolean {
  if (events.length === 0) return false;
  for (const ev of events) {
    switch (ev.kind) {
      case "update_thinking":
        updateThinkingStep(ev.label, ev.detail);
        break;
      case "push_step":
        markLastComplete();
        S.accumulatedSteps.push(ev.step);
        S.lastStepType = ev.step.type === "thinking" ? "thinking" : "tool";
        if (ev.step.type !== "thinking") {
          noteToolStarted(ev.step);
          if (ev.trackingId) S.codexToolItemIds.add(ev.trackingId);
          S.inFlightToolUses++;
        }
        break;
      case "complete_tool":
        markLastComplete();
        if (ev.trackingId !== undefined) {
          if (
            S.codexToolItemIds.delete(ev.trackingId) &&
            S.inFlightToolUses > 0
          ) {
            S.inFlightToolUses--;
            noteToolCompleted();
          }
        } else if (S.inFlightToolUses > 0) {
          S.inFlightToolUses--;
          noteToolCompleted();
        }
        break;
      case "mark_last_complete":
        markLastComplete();
        break;
      case "append_text":
        appendStreamedContent(ev.text);
        updateThinkingStep("Streaming response...", "Receiving reply...");
        break;
      case "set_pending_question":
        S.pendingQuestionData = ev.data;
        break;
      case "set_codex_thread":
        S.activeCodexThreadId = ev.threadId;
        break;
      case "mark_first_assistant":
        S.waitingForFirstAssistantEvent = false;
        break;
    }
  }
  return true;
}

/** Parses a single JSON stream event line and updates accumulated steps. */
export function parseStreamEvent(line: string): boolean {
  const event = tryParseJson(line);
  if (!event || typeof event !== "object" || Array.isArray(event)) {
    return false;
  }
  try {
    return applyCanonicalEvents(parseToCanonical(event, PROVIDER));
  } catch {
    return false;
  }
}

/** Returns the maximum silence window for a started tool step. */
export function toolTimeoutMsForStep(step: ProgressStep): number {
  if (step.type === "bash" || step.type === "subtask") {
    return SHELL_TOOL_TIMEOUT_MS;
  }
  return NON_SHELL_TOOL_TIMEOUT_MS;
}

/** Records the oldest active tool so stuck searches/reads do not pause watchdogs forever. */
export function noteToolStarted(step: ProgressStep): void {
  const timeoutMs = toolTimeoutMsForStep(step);
  if (S.inFlightToolUses === 0 || S.activeToolStartedAt === 0) {
    S.activeToolStartedAt = Date.now();
    S.activeToolLabel = step.label || step.type || "tool";
    S.activeToolTimeoutMs = timeoutMs;
    return;
  }
  S.activeToolTimeoutMs = Math.min(
    S.activeToolTimeoutMs || timeoutMs,
    timeoutMs,
  );
}

/** Clears active tool stall tracking once all tool calls have resolved. */
export function noteToolCompleted(): void {
  if (S.inFlightToolUses > 0) {
    return;
  }
  S.activeToolStartedAt = 0;
  S.activeToolLabel = "";
  S.activeToolTimeoutMs = 0;
}

/** Builds a terminal error when a tool has been active too long. */
export function activeToolStallMessage(): string {
  if (S.inFlightToolUses <= 0 || S.activeToolStartedAt === 0) {
    return "";
  }
  const timeoutMs = S.activeToolTimeoutMs || NON_SHELL_TOOL_TIMEOUT_MS;
  const activeMs = Date.now() - S.activeToolStartedAt;
  if (activeMs <= timeoutMs) {
    return "";
  }
  return (
    "Tool stalled while " +
    (S.activeToolLabel || "using tool") +
    " for " +
    activeMs +
    "ms (limit " +
    timeoutMs +
    "ms)"
  );
}

/** Appends new text to the current streamed content buffer. */
export function appendStreamedContent(text: string): void {
  const nextText = String(text);
  if (!nextText) {
    return;
  }
  if (nextText.startsWith(S.currentStreamedContent)) {
    S.currentStreamedContent = nextText;
    return;
  }
  S.currentStreamedContent += nextText;
}
