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
          registerActiveToolStall(ev.step, ev.trackingId);
          if (ev.trackingId) S.codexToolItemIds.add(ev.trackingId);
          S.inFlightToolUses++;
        }
        break;
      case "complete_tool":
        markLastComplete();
        if (ev.trackingId !== undefined) {
          const removedCodex = S.codexToolItemIds.delete(ev.trackingId);
          const removedStall = removeActiveToolStall(ev.trackingId);
          if ((removedCodex || removedStall) && S.inFlightToolUses > 0) {
            S.inFlightToolUses--;
          }
        } else if (S.inFlightToolUses > 0) {
          removeActiveToolStall(undefined);
          S.inFlightToolUses--;
        }
        if (S.inFlightToolUses === 0) {
          S.activeToolStalls.clear();
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

function registerActiveToolStall(
  step: ProgressStep,
  trackingId?: string,
): string {
  const id =
    trackingId && trackingId.trim()
      ? trackingId.trim()
      : "tool-" + String(++S.anonymousToolSeq);
  S.activeToolStalls.set(id, {
    startedAt: Date.now(),
    timeoutMs: toolTimeoutMsForStep(step),
    label: step.label || step.type || "tool",
  });
  return id;
}

function removeActiveToolStall(trackingId?: string): boolean {
  if (trackingId && S.activeToolStalls.delete(trackingId)) {
    return true;
  }
  if (!trackingId && S.activeToolStalls.size > 0) {
    let oldestId = "";
    let oldestAt = Number.POSITIVE_INFINITY;
    for (const [id, tool] of S.activeToolStalls) {
      if (tool.startedAt < oldestAt) {
        oldestAt = tool.startedAt;
        oldestId = id;
      }
    }
    if (oldestId) {
      return S.activeToolStalls.delete(oldestId);
    }
  }
  return false;
}

/** Builds a terminal error when a tool has been active too long. */
export function activeToolStallMessage(): string {
  if (S.inFlightToolUses <= 0 || S.activeToolStalls.size === 0) {
    return "";
  }
  for (const tool of S.activeToolStalls.values()) {
    const activeMs = Date.now() - tool.startedAt;
    if (activeMs > tool.timeoutMs) {
      return (
        "Tool stalled while " +
        tool.label +
        " for " +
        activeMs +
        "ms (limit " +
        tool.timeoutMs +
        "ms)"
      );
    }
  }
  return "";
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
