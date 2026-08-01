import type {
  CliAttemptResult,
  CursorAcpAttemptResult,
  ResultEvent,
} from "../types.js";
import { normalizedCursorModel } from "../config.js";

export function isCursorAcpAttempt(
  attempt: CliAttemptResult | CursorAcpAttemptResult,
): attempt is CursorAcpAttemptResult {
  return "transport" in attempt && attempt.transport === "acp-v1";
}

export function cursorAcpFailure(
  attempt: CursorAcpAttemptResult,
): string | null {
  const hasMedia = attempt.events.some(
    (event) =>
      event.kind === "complete_tool" &&
      event.result?.files !== undefined &&
      event.result.files.length > 0,
  );
  if (attempt.stopReason === "end_turn") {
    return attempt.result.trim() || hasMedia
      ? null
      : "Cursor completed the turn without an assistant response.";
  }
  if (attempt.stopReason === "max_tokens") {
    return "Cursor reached the model token limit before completing the turn.";
  }
  if (attempt.stopReason === "max_turn_requests") {
    return "Cursor reached its turn-request limit before completing the turn.";
  }
  if (attempt.stopReason === "refusal") {
    return "Cursor refused the request.";
  }
  return "Cursor cancelled the turn before completion.";
}

export function cursorAcpResultEvent(
  attempt: CursorAcpAttemptResult,
): ResultEvent {
  const usage = attempt.usage;
  const contextCost = attempt.contextUsage?.cost;
  const totalCostUsd =
    contextCost?.currency === "USD" ? contextCost.amount : undefined;
  return {
    result: attempt.result,
    isError: false,
    rawResultEvent: JSON.stringify({
      transport: attempt.transport,
      provider: "cursor",
      sessionId: attempt.sessionId,
      acp_session_id: attempt.sessionId,
      stopReason: attempt.stopReason,
      durationMs: attempt.durationMs,
      duration_ms: attempt.durationMs,
      usage_available: usage !== null,
      usage_scope: "session",
      usage: {
        input_tokens: usage?.inputTokens ?? 0,
        output_tokens: (usage?.outputTokens ?? 0) + (usage?.thoughtTokens ?? 0),
        cache_read_input_tokens: usage?.cachedReadTokens ?? 0,
        cache_creation_input_tokens: usage?.cachedWriteTokens ?? 0,
      },
      total_tokens: usage?.totalTokens,
      modelUsage: { [normalizedCursorModel]: {} },
      total_cost_usd: totalCostUsd,
      context_used_tokens: attempt.contextUsage?.used,
      context_window_size: attempt.contextUsage?.size,
      context_cost: contextCost,
      promptSubmitted: attempt.promptSubmitted,
      cancellationAcknowledged: attempt.cancellationAcknowledged,
    }),
  };
}
