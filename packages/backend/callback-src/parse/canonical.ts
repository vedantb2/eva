import { completedLabels, PROVIDER } from "../config.js";
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

/** Thinking is a transient liveness signal, not a durable activity row. */
export function updateThinkingStep(label: string, detail?: string): void {
  void label;
  void detail;
  S.lastStepType = "thinking";
}

/** Max chars kept in a streamed reasoning step's detail. Older text is dropped
 * from the head so the tail (most recent content) survives. */
const REASONING_DETAIL_MAX_CHARS = 20000;

function capReasoningDetail(text: string): string {
  return text.length > REASONING_DETAIL_MAX_CHARS
    ? text.slice(text.length - REASONING_DETAIL_MAX_CHARS)
    : text;
}

/**
 * Accumulates the model's reasoning text into a durable "reasoning" step so the
 * UI can surface it as a collapsed "Thought process" accordion. Merges incoming
 * deltas into the active reasoning step (de-duping cumulative-snapshot providers
 * that resend the full text from delta-streaming ones), or starts a new one.
 */
export function updateReasoningStep(text: string): void {
  const lastStep = S.accumulatedSteps[S.accumulatedSteps.length - 1];
  if (
    lastStep &&
    lastStep.type === "reasoning" &&
    lastStep.status === "active"
  ) {
    const existing = lastStep.detail ?? "";
    lastStep.detail = capReasoningDetail(
      text.startsWith(existing) ? text : existing + text,
    );
    S.lastStepType = "thinking";
    return;
  }
  markLastComplete();
  S.accumulatedSteps.push({
    type: "reasoning",
    label: "Thought process",
    detail: capReasoningDetail(text),
    status: "active",
  });
  S.lastStepType = "thinking";
}

function shouldRecordProgressStep(step: ProgressStep): boolean {
  return (
    step.type !== "thinking" &&
    step.type !== "reasoning" &&
    step.type !== "response"
  );
}

function pushProgressStep(step: ProgressStep): void {
  if (!shouldRecordProgressStep(step)) {
    updateThinkingStep(step.label, step.detail);
    return;
  }
  markLastComplete();
  S.accumulatedSteps.push(step);
  S.lastStepType = "tool";
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
        pushProgressStep(ev.step);
        if (shouldRecordProgressStep(ev.step)) {
          if (ev.trackingId) S.codexToolItemIds.add(ev.trackingId);
          S.inFlightToolUses++;
        }
        break;
      case "complete_tool":
        markLastComplete();
        if (ev.trackingId !== undefined) {
          S.codexToolItemIds.delete(ev.trackingId);
        }
        if (S.inFlightToolUses > 0) {
          S.inFlightToolUses--;
        }
        break;
      case "mark_last_complete":
        markLastComplete();
        break;
      case "append_text":
        appendStreamedContent(ev.text);
        break;
      case "update_reasoning":
        updateReasoningStep(ev.text);
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
