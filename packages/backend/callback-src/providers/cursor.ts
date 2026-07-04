import { cursorToolToStep } from "../parse/toolSteps.js";
import {
  syncCursorStateToPersist,
  writeCursorSessionState,
} from "../session/cursorSession.js";
import { callbackState as S } from "../runtime/state.js";
import type { CanonicalEvent, JsonObject, StreamLineResult } from "../types.js";
import type { ProviderAdapter } from "./types.js";

export function cursorParseLine(event: JsonObject): CanonicalEvent[] {
  const events: CanonicalEvent[] = [];
  if (event.type === "system" && event.subtype === "init") {
    events.push({
      kind: "update_thinking",
      label: "Starting Cursor CLI...",
      detail: "Cursor session initializing...",
    });
    return events;
  }
  if (event.type === "assistant") {
    const message =
      event.message &&
      typeof event.message === "object" &&
      !Array.isArray(event.message)
        ? event.message
        : null;
    const contentBlocks =
      message && Array.isArray(message.content) ? message.content : [];
    for (const block of contentBlocks) {
      if (
        block &&
        typeof block === "object" &&
        !Array.isArray(block) &&
        block.type === "text" &&
        typeof block.text === "string" &&
        block.text
      ) {
        events.push({ kind: "append_text", text: block.text });
      } else if (
        block &&
        typeof block === "object" &&
        !Array.isArray(block) &&
        block.type === "thinking" &&
        typeof block.thinking === "string" &&
        block.thinking
      ) {
        // Cursor's stream-json mirrors Claude's; capture thinking blocks as
        // real reasoning text when the model emits them.
        events.push({ kind: "update_reasoning", text: block.thinking });
      }
    }
    return events;
  }
  if (
    event.type === "tool_call" &&
    event.subtype === "started" &&
    event.tool_call &&
    typeof event.tool_call === "object" &&
    !Array.isArray(event.tool_call)
  ) {
    events.push({ kind: "push_step", step: cursorToolToStep(event.tool_call) });
    return events;
  }
  if (event.type === "tool_call" && event.subtype === "completed") {
    events.push({ kind: "complete_tool" });
    return events;
  }
  if (event.type === "result") {
    events.push({ kind: "mark_last_complete" });
    return events;
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
    const sid = parsed.session_id.trim();
    if (sid !== S.activeCursorSessionId) {
      S.activeCursorSessionId = sid;
      writeCursorSessionState();
      return { needsHeartbeat: true };
    }
    return {};
  }
  if (parsed.type === "assistant") {
    if (S.firstAssistantEventAt === 0) S.firstAssistantEventAt = Date.now();
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
        typeof block.text === "string" &&
        S.firstTextBlockAt === 0
      ) {
        S.firstTextBlockAt = Date.now();
        break;
      }
    }
    return {};
  }
  if (parsed.type === "tool_call") {
    S.firstTextBlockAt = 0;
    return {};
  }
  if (parsed.type === "result" && !S.resultEventSeen) {
    S.resultEventSeen = true;
    syncCursorStateToPersist();
  }
  return {};
}

export const cursorAdapter: ProviderAdapter = {
  parseLine: cursorParseLine,
  onStreamLine(_line: string, parsed: JsonObject): StreamLineResult {
    return onStreamLine(parsed);
  },
};
