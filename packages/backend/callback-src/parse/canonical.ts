import { completedLabels, PROVIDER } from "../config.js";
import { claudeParseLine } from "../providers/claude.js";
import { codexParseLine } from "../providers/codex.js";
import { cursorParseLine } from "../providers/cursor.js";
import { opencodeParseLine } from "../providers/opencode.js";
import { callbackState as S } from "../runtime/state.js";
import type {
  CanonicalEvent,
  JsonObject,
  ProgressStep,
  TodoItem,
  ToolCompleteResult,
} from "../types.js";
import { tryParseJson } from "../utils.js";
import {
  completeStatusOnNonStatusMessage,
  consumesClaudeSdkTaxonomyMessage,
  parseClaudeSdkTaxonomy,
} from "./sdkTaxonomy.js";

/** Push-time timestamps for durationMs (not persisted across serialize). */
const stepStartedAt = new WeakMap<ProgressStep, number>();

function mergeToolResult(step: ProgressStep, result: ToolCompleteResult): void {
  if (result.output) {
    step.output = result.output;
  }
  if (result.isError !== undefined) {
    step.isError = result.isError;
  }
  if (result.files && result.files.length > 0) {
    step.files = result.files;
  }
  if (result.durationMs !== undefined) {
    step.durationMs = result.durationMs;
  }
}

/** Flips one step to complete and swaps its in-progress label for the past-tense one. */
function markStepComplete(step: ProgressStep): void {
  step.status = "complete";
  if (completedLabels[step.label]) {
    step.label = completedLabels[step.label];
  } else if (step.label.startsWith("Using ") && step.label.endsWith("...")) {
    step.label = "Used " + step.label.slice(6, -3);
  }
  if (step.durationMs === undefined) {
    const started = stepStartedAt.get(step);
    if (started !== undefined) {
      step.durationMs = Date.now() - started;
    }
  }
}

/** Marks the last accumulated step as complete and updates its label. */
export function markLastComplete(): void {
  if (S.accumulatedSteps.length === 0) return;
  markStepComplete(S.accumulatedSteps[S.accumulatedSteps.length - 1]);
}

/**
 * Completes the step whose `toolUseId` matches this tool_result (Claude sets it
 * on every tool_use). Falls back to the last step for providers/steps without an
 * id. Matching by id is what lets a subagent's parent `Agent` step stay active
 * until its own tool_result, rather than being closed by its first child.
 */
function completeToolStep(
  trackingId?: string,
  result?: ToolCompleteResult,
): void {
  if (trackingId) {
    for (let i = S.accumulatedSteps.length - 1; i >= 0; i--) {
      const step = S.accumulatedSteps[i];
      if (step.toolUseId === trackingId) {
        if (result) mergeToolResult(step, result);
        markStepComplete(step);
        return;
      }
    }
  }
  if (S.accumulatedSteps.length > 0) {
    const last = S.accumulatedSteps[S.accumulatedSteps.length - 1];
    if (result) mergeToolResult(last, result);
    markStepComplete(last);
    return;
  }
}

/** Short "N of M done" summary used as the todos step's fallback detail. */
function summarizeTodos(todos: TodoItem[]): string {
  const done = todos.filter((t) => t.status === "completed").length;
  return `${done} of ${todos.length} done`;
}

/**
 * Applies a todo checklist snapshot. TodoWrite/TaskCreate/TaskUpdate fire many
 * times per turn; rather than one activity row per call, we keep ONE evolving
 * "todos" step and update it in place so the UI shows a single live checklist.
 */
function applyTodosSnapshot(todos: TodoItem[]): void {
  const existing = S.accumulatedSteps.find((step) => step.type === "todos");
  if (existing) {
    existing.todos = todos;
    existing.detail = summarizeTodos(todos);
    return;
  }
  markLastComplete();
  S.accumulatedSteps.push({
    type: "todos",
    label: "Updating tasks...",
    detail: summarizeTodos(todos),
    todos,
    status: "active",
  });
  S.lastStepType = "tool";
}

/** Thinking is a transient liveness signal, not a durable activity row. */
export function updateThinkingStep(label: string, detail?: string): void {
  void label;
  void detail;
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
  // When pushing the FIRST step inside a subagent, don't auto-complete its
  // parent `Agent` step — the parent stays active until its own tool_result
  // (completed by toolUseId). Sibling children still close each other normally.
  const last = S.accumulatedSteps[S.accumulatedSteps.length - 1];
  const isFirstChildUnderParent =
    step.parentToolUseId !== undefined &&
    last !== undefined &&
    last.toolUseId === step.parentToolUseId;
  if (!isFirstChildUnderParent) {
    markLastComplete();
  }
  S.accumulatedSteps.push(step);
  stepStartedAt.set(step, Date.now());
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
        completeToolStep(ev.trackingId, ev.result);
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
        // A whole (non-streamed) assistant text block — always a boundary, so a
        // paragraph break separates it from any prior block.
        appendStreamedContent(ev.text, true);
        break;
      case "stream_text_delta":
        // Live token delta from an Anthropic partial message. Appends exactly
        // like append_text but marks the flag so the FINAL assistant message's
        // duplicate text block is skipped (see claudeParseLine dedup). The break
        // is applied only on the first delta after a message boundary.
        appendStreamedContent(ev.text, S.pendingParagraphBreak);
        S.pendingParagraphBreak = false;
        S.streamedAssistantTextThisMessage = true;
        break;
      case "mark_message_start":
        // A new assistant message is beginning; clear the per-message dedup flag
        // so its text blocks stream fresh, and request a paragraph break before
        // this message's first streamed text.
        S.streamedAssistantTextThisMessage = false;
        S.pendingParagraphBreak = true;
        break;
      case "mark_text_block_start":
        // A new text content block is opening inside the current message. With
        // interleaved thinking the model emits text → thinking → text within one
        // message (no message_start between them), so request a paragraph break
        // here too — otherwise consecutive text blocks butt together. The break
        // itself only lands when there is prior content (see appendStreamedContent).
        S.pendingParagraphBreak = true;
        break;
      case "update_reasoning":
        S.lastStepType = "thinking";
        break;
      case "set_pending_question":
        S.pendingQuestionData = ev.data;
        break;
      case "set_todos":
        applyTodosSnapshot(ev.todos);
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
    completeStatusOnNonStatusMessage(event);
    if (consumesClaudeSdkTaxonomyMessage(event)) {
      applyCanonicalEvents(parseClaudeSdkTaxonomy(event));
      return true;
    }
    return applyCanonicalEvents(parseToCanonical(event, PROVIDER));
  } catch {
    return false;
  }
}

/** Appends new text to the current streamed content buffer. */
function appendStreamedContent(text: string, isBlockBoundary = false): void {
  const nextText = String(text);
  if (!nextText) {
    return;
  }
  if (nextText.startsWith(S.currentStreamedContent)) {
    // A full snapshot supersedes the accumulated streamed text (dedup); never a
    // boundary, so no separator is inserted.
    S.currentStreamedContent = nextText;
    return;
  }
  if (
    isBlockBoundary &&
    S.currentStreamedContent.length > 0 &&
    !S.currentStreamedContent.endsWith("\n") &&
    !nextText.startsWith("\n")
  ) {
    // Distinct assistant message/block — keep a paragraph break so the end of
    // one block does not butt against the start of the next.
    S.currentStreamedContent += "\n\n";
  }
  S.currentStreamedContent += nextText;
}
