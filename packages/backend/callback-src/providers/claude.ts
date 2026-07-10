import {
  buildClaudeStartupStep,
  syncClaudeStateToPersist,
} from "../session/claudeSession.js";
import { updateThinkingStep } from "../parse/canonical.js";
import { toolCallToStep } from "../parse/toolSteps.js";
import { callbackState as S } from "../runtime/state.js";
import type { CanonicalEvent, JsonObject, StreamLineResult } from "../types.js";
import { elapsedAttemptMs, log } from "../utils.js";
import type { ProviderAdapter } from "./types.js";

/**
 * Handles Anthropic partial (`stream_event`) messages emitted when the SDK is
 * run with `includePartialMessages: true`. These carry token-level deltas:
 *   { type: "stream_event", event: { type: "content_block_delta",
 *       delta: { type: "text_delta", text: "..." } } }
 * plus lifecycle frames (message_start / content_block_start / _stop /
 * message_stop) and `thinking_delta`. We stream text_delta tokens live and map
 * thinking_delta to the existing reasoning liveness signal. Tool/json deltas
 * (input_json_delta) are ignored — the final assistant message still carries
 * the complete tool_use block. All field accesses are guarded (objects, not
 * arrays/null) to match the rest of the parser.
 */
function parseClaudeStreamEvent(event: JsonObject): CanonicalEvent[] {
  const events: CanonicalEvent[] = [];
  const inner =
    event.event &&
    typeof event.event === "object" &&
    !Array.isArray(event.event)
      ? event.event
      : null;
  if (!inner) return events;
  if (inner.type === "message_start") {
    events.push({ kind: "mark_message_start" });
    return events;
  }
  if (inner.type !== "content_block_delta") return events;
  const delta =
    inner.delta &&
    typeof inner.delta === "object" &&
    !Array.isArray(inner.delta)
      ? inner.delta
      : null;
  if (!delta) return events;
  if (delta.type === "text_delta" && typeof delta.text === "string") {
    if (delta.text) {
      events.push({ kind: "stream_text_delta", text: delta.text });
    }
    return events;
  }
  if (delta.type === "thinking_delta" && typeof delta.thinking === "string") {
    if (delta.thinking) {
      events.push({ kind: "update_reasoning", text: delta.thinking });
    }
  }
  return events;
}

export function claudeParseLine(event: JsonObject): CanonicalEvent[] {
  const events: CanonicalEvent[] = [];
  if (event.type === "stream_event") {
    return parseClaudeStreamEvent(event);
  }
  if (event.type === "tool_result") {
    const toolUseId =
      typeof event.tool_use_id === "string" && event.tool_use_id.trim()
        ? event.tool_use_id.trim()
        : undefined;
    events.push({ kind: "complete_tool", trackingId: toolUseId });
    return events;
  }
  if (event.type === "user") {
    const message =
      event.message &&
      typeof event.message === "object" &&
      !Array.isArray(event.message)
        ? event.message
        : null;
    const content =
      message && Array.isArray(message.content) ? message.content : [];
    for (const block of content) {
      if (!block || typeof block !== "object" || Array.isArray(block)) continue;
      if (
        block.type === "tool_result" &&
        typeof block.tool_use_id === "string" &&
        block.tool_use_id.trim()
      ) {
        events.push({
          kind: "complete_tool",
          trackingId: block.tool_use_id.trim(),
        });
      }
    }
    if (events.length > 0) {
      return events;
    }
  }
  if (event.type !== "assistant") return events;

  if (S.waitingForFirstAssistantEvent) {
    events.push({ kind: "mark_first_assistant" });
  }
  const message =
    event.message &&
    typeof event.message === "object" &&
    !Array.isArray(event.message)
      ? event.message
      : null;
  const content =
    message && Array.isArray(message.content) ? message.content : [];
  for (const block of content) {
    if (!block || typeof block !== "object" || Array.isArray(block)) continue;
    if (block.type === "tool_use" && typeof block.name === "string") {
      const input =
        block.input &&
        typeof block.input === "object" &&
        !Array.isArray(block.input)
          ? block.input
          : {};
      const step = toolCallToStep(block.name, input);
      const trackingId =
        typeof block.id === "string" && block.id.trim()
          ? block.id.trim()
          : undefined;
      events.push(
        trackingId
          ? { kind: "push_step", step, trackingId }
          : { kind: "push_step", step },
      );
      if (block.name === "AskUserQuestion" && block.input) {
        events.push({
          kind: "set_pending_question",
          data: JSON.stringify(block.input),
        });
      }
    } else if (
      block.type === "thinking" &&
      "thinking" in block &&
      block.thinking
    ) {
      events.push({ kind: "update_reasoning", text: String(block.thinking) });
    } else if (block.type === "text" && "text" in block && block.text) {
      // Dedup: when text was already streamed live via text_delta partials
      // (flag set in applyCanonicalEvents), the final assistant message repeats
      // the same complete text — skip it to avoid doubling. When no deltas
      // streamed (flag false — non-partial path or other frames), append as the
      // fallback so text is never lost.
      if (!S.streamedAssistantTextThisMessage) {
        events.push({ kind: "append_text", text: String(block.text) });
      }
    }
  }
  return events;
}

function onStreamLine(parsed: JsonObject): StreamLineResult {
  if (
    parsed.type === "system" &&
    parsed.subtype === "init" &&
    typeof parsed.session_id === "string" &&
    parsed.session_id.trim()
  ) {
    S.activeClaudeSessionId = parsed.session_id.trim();
    S.claudeInitAt = Date.now();
    S.waitingForFirstAssistantEvent = true;
    log(
      "claude init event after " +
        String(elapsedAttemptMs()) +
        "ms sessionId=" +
        S.activeClaudeSessionId,
    );
    log("captured Claude session id " + S.activeClaudeSessionId);
    const startupStep = buildClaudeStartupStep();
    updateThinkingStep(startupStep.label, startupStep.detail);
    return { needsHeartbeat: true };
  }
  if (parsed.type === "assistant") {
    if (S.firstAssistantEventAt === 0) {
      S.firstAssistantEventAt = Date.now();
      log(
        "first assistant event after " +
          String(S.firstAssistantEventAt - S.activeAttemptStartedAt) +
          "ms",
      );
    }
    const message =
      parsed.message &&
      typeof parsed.message === "object" &&
      !Array.isArray(parsed.message)
        ? parsed.message
        : null;
    const contentBlocks =
      message && Array.isArray(message.content) ? message.content : [];
    for (const block of contentBlocks) {
      if (
        block &&
        typeof block === "object" &&
        !Array.isArray(block) &&
        block.type === "text" &&
        typeof block.text === "string"
      ) {
        if (S.firstTextBlockAt === 0) {
          S.firstTextBlockAt = Date.now();
          log(
            "first text block after " +
              String(S.firstTextBlockAt - S.activeAttemptStartedAt) +
              "ms chars=" +
              String(block.text.length),
          );
        }
        break;
      }
    }
    return {};
  }
  if (parsed.type === "result" && !S.resultEventSeen) {
    S.resultEventSeen = true;
    syncClaudeStateToPersist("result-event");
  }
  return {};
}

export const claudeAdapter: ProviderAdapter = {
  parseLine: claudeParseLine,
  onStreamLine(_line: string, parsed: JsonObject): StreamLineResult {
    return onStreamLine(parsed);
  },
};
