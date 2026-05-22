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

export function claudeParseLine(event: JsonObject): CanonicalEvent[] {
  const events: CanonicalEvent[] = [];
  if (event.type === "tool_result") {
    events.push({ kind: "complete_tool" });
    return events;
  }
  if (event.type !== "assistant") return events;

  if (S.waitingForFirstAssistantEvent) {
    events.push({ kind: "mark_first_assistant" });
  }
  let added = false;
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
      events.push({ kind: "push_step", step });
      if (block.name === "AskUserQuestion" && block.input) {
        events.push({
          kind: "set_pending_question",
          data: JSON.stringify(block.input),
        });
      }
      added = true;
    } else if (
      block.type === "thinking" &&
      "thinking" in block &&
      block.thinking
    ) {
      events.push({
        kind: "push_step",
        step: {
          type: "thinking",
          label: "Thinking...",
          detail: String(block.thinking),
          status: "active",
        },
      });
      added = true;
    } else if (block.type === "text" && "text" in block && block.text) {
      events.push({ kind: "append_text", text: String(block.text) });
      added = true;
    }
  }
  if (!added && S.lastStepType !== "thinking") {
    events.push({
      kind: "push_step",
      step: {
        type: "thinking",
        label: "Generating response...",
        status: "active",
      },
    });
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
      updateThinkingStep("Thinking...", "Claude is reasoning...");
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
