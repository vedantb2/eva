/**
 * Conversational Haiku turns have no tools/MCP. When the request needs them,
 * Haiku replies with this sentinel and the daemon re-dispatches the same turn
 * onto the full agent query.
 */
export const ESCALATION_SENTINEL = "<<EVA_ESCALATE>>";

/** True when the assistant reply is (or starts with) the escalation sentinel. */
export function isEscalationReply(text: string): boolean {
  return text.trimStart().startsWith(ESCALATION_SENTINEL);
}

/**
 * Hold live streaming while the accumulated text could still become the
 * sentinel — avoids flashing `<<EVA_ESCALATE>>` in the UI before escalate.
 */
export function shouldHoldConversationalStream(text: string): boolean {
  const trimmed = text.trimStart();
  if (trimmed.length === 0) return true;
  if (isEscalationReply(trimmed)) return true;
  return ESCALATION_SENTINEL.startsWith(trimmed);
}
