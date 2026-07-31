import type {
  CliAttemptResult,
  CursorAcpAttemptResult,
  ResultEvent,
} from "../types.js";

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
  return {
    result: attempt.result,
    isError: false,
    rawResultEvent: JSON.stringify({
      transport: attempt.transport,
      sessionId: attempt.sessionId,
      stopReason: attempt.stopReason,
      durationMs: attempt.durationMs,
      promptSubmitted: attempt.promptSubmitted,
      cancellationAcknowledged: attempt.cancellationAcknowledged,
    }),
  };
}
