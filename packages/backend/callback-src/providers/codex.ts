import {
  codexItemToStep,
  getCodexAgentMessageText,
  getCodexThreadId,
} from "../parse/toolSteps.js";
import { probeCodexItemResult } from "../parse/toolResultCapture.js";
import {
  syncCodexStateToPersist,
  writeCodexSessionState,
} from "../session/codexSession.js";
import { callbackState as S } from "../runtime/state.js";
import type { CanonicalEvent, JsonObject, StreamLineResult } from "../types.js";
import { tryParseJson } from "../utils.js";
import type { ProviderAdapter } from "./types.js";

export function codexParseLine(event: JsonObject): CanonicalEvent[] {
  const events: CanonicalEvent[] = [];
  const threadId = getCodexThreadId(event);
  if (event.type === "thread.started" && threadId) {
    events.push({ kind: "set_codex_thread", threadId });
    events.push({
      kind: "update_thinking",
      label: "Starting Codex CLI...",
      detail: "Restoring saved context...",
    });
    return events;
  }
  if (event.type === "turn.started") {
    events.push({
      kind: "update_thinking",
      label: "Starting Codex CLI...",
      detail: "Codex is reasoning...",
    });
    return events;
  }
  if (
    event.type === "item.agent_message.delta" &&
    typeof event.delta === "string" &&
    event.delta
  ) {
    events.push({ kind: "stream_text_delta", text: event.delta });
    return events;
  }
  if (
    event.type === "item.reasoning.delta" &&
    typeof event.delta === "string" &&
    event.delta
  ) {
    events.push({ kind: "update_reasoning", text: event.delta });
    return events;
  }
  if (
    event.type === "item.started" &&
    event.item &&
    typeof event.item === "object" &&
    !Array.isArray(event.item) &&
    (event.item.type === "agent_message" || event.item.type === "agentMessage")
  ) {
    events.push({ kind: "mark_message_start" });
    return events;
  }
  // Reasoning items carry the model's actual thinking text. Skip on start
  // (no tool step) and route the text on completion; without this they'd be
  // misclassified as a generic "Using reasoning..." tool step.
  if (
    (event.type === "item.started" ||
      event.type === "item.updated" ||
      event.type === "item.completed") &&
    event.item &&
    typeof event.item === "object" &&
    !Array.isArray(event.item) &&
    event.item.type === "reasoning"
  ) {
    if (typeof event.item.text === "string" && event.item.text.trim()) {
      events.push({ kind: "update_reasoning", text: event.item.text });
    }
    return events;
  }
  if (
    event.type === "item.started" &&
    event.item &&
    typeof event.item === "object" &&
    !Array.isArray(event.item) &&
    typeof event.item.type === "string" &&
    event.item.type !== "agent_message" &&
    event.item.type !== "agentMessage"
  ) {
    const step = codexItemToStep(event.item);
    const trackingId =
      step.type !== "thinking" && typeof event.item.id === "string"
        ? event.item.id
        : undefined;
    events.push(
      trackingId
        ? { kind: "push_step", step, trackingId }
        : { kind: "push_step", step },
    );
    return events;
  }
  if (
    event.type === "item.completed" &&
    event.item &&
    typeof event.item === "object" &&
    !Array.isArray(event.item) &&
    (event.item.type === "agent_message" || event.item.type === "agentMessage")
  ) {
    const messageText = getCodexAgentMessageText(event.item);
    if (messageText && !S.streamedAssistantTextThisMessage) {
      events.push({ kind: "append_text", text: messageText });
    }
    return events;
  }
  if (
    (event.type === "item.completed" || event.type === "item.failed") &&
    event.item &&
    typeof event.item === "object" &&
    !Array.isArray(event.item) &&
    typeof event.item.type === "string" &&
    event.item.type !== "agent_message" &&
    event.item.type !== "agentMessage"
  ) {
    const result = probeCodexItemResult(
      event.item,
      event.type === "item.failed",
    );
    if (typeof event.item.id === "string") {
      events.push(
        result
          ? {
              kind: "complete_tool",
              trackingId: event.item.id,
              result,
            }
          : { kind: "complete_tool", trackingId: event.item.id },
      );
    } else if (result) {
      events.push({ kind: "complete_tool", result });
    } else {
      events.push({ kind: "mark_last_complete" });
    }
    return events;
  }
  if (event.type === "turn.completed") {
    events.push({ kind: "mark_last_complete" });
    return events;
  }
  return events;
}

function inspectCodexStdout(text: string): void {
  for (const line of text.split("\n")) {
    const clean = line.trim();
    if (!clean) continue;
    try {
      const parsed = tryParseJson(clean);
      if (
        parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed) &&
        parsed.type === "item.completed" &&
        parsed.item &&
        typeof parsed.item === "object" &&
        !Array.isArray(parsed.item) &&
        parsed.item.type === "agent_message" &&
        getCodexAgentMessageText(parsed.item) &&
        S.firstTextBlockAt === 0
      ) {
        S.firstTextBlockAt = Date.now();
      }
    } catch {
      /* ignore non-json lines */
    }
  }
}

function onStreamLine(parsed: JsonObject): StreamLineResult {
  const threadId = getCodexThreadId(parsed);
  if (parsed.type === "thread.started" && threadId) {
    S.activeCodexThreadId = threadId;
    writeCodexSessionState();
    return {};
  }
  if (parsed.type === "turn.completed" && !S.resultEventSeen) {
    S.resultEventSeen = true;
    syncCodexStateToPersist();
  }
  return {};
}

export const codexAdapter: ProviderAdapter = {
  parseLine: codexParseLine,
  onStreamLine(_line: string, parsed: JsonObject): StreamLineResult {
    return onStreamLine(parsed);
  },
  onStdoutText: inspectCodexStdout,
};
