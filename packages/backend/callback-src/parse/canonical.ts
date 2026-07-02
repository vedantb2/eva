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

/** Max chars kept in a streamed "response"/"reasoning" step detail. Older
 * text is dropped from the head so the tail (most recent content) survives. */
const STREAMED_DETAIL_MAX_CHARS = 20000;

function capDetail(text: string): string {
  return text.length > STREAMED_DETAIL_MAX_CHARS
    ? text.slice(text.length - STREAMED_DETAIL_MAX_CHARS)
    : text;
}

/** Merges incoming text into an accumulated step of the given `type`,
 * de-duping cumulative-snapshot providers from delta-streaming ones (mirrors
 * `appendStreamedContent`'s prefix logic). Creates a new active step if the
 * last accumulated step isn't already an active step of this type. */
function updateTextStep(
  type: "response" | "reasoning",
  label: string,
  text: string,
): void {
  const lastStep = S.accumulatedSteps[S.accumulatedSteps.length - 1];
  if (lastStep && lastStep.type === type && lastStep.status === "active") {
    const existing = lastStep.detail ?? "";
    lastStep.detail = capDetail(
      text.startsWith(existing) ? text : existing + text,
    );
    S.lastStepType = "thinking";
    return;
  }
  markLastComplete();
  S.accumulatedSteps.push({
    type,
    label,
    detail: capDetail(text),
    status: "active",
  });
  S.lastStepType = "thinking";
}

/** Updates or adds the streamed response-text step. */
export function updateResponseStep(text: string): void {
  updateTextStep("response", "Streaming response...", text);
}

/** Updates or adds the streamed reasoning-text step. */
export function updateReasoningStep(text: string): void {
  updateTextStep("reasoning", "Thinking...", text);
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
        updateResponseStep(ev.text);
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
