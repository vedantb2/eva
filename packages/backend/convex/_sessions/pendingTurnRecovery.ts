/**
 * Whether a session is still waiting on a turn no daemon can claim.
 *
 * A cancel arriving while `startExecute` was staging the turn wiped
 * `pendingTurn` after the workflow had already begun waiting on
 * `sessionComplete`, so the daemon polled an empty session forever and the chat
 * sat on an open bubble until the stale handler fired. Both recovery paths —
 * the in-workflow re-stage and the ops re-stage — hinge on this one question,
 * and each of its four conditions has its own way of going wrong, so it lives
 * here where it can be tested directly.
 */

/** Only the fields the decision reads; the real message docs carry many more. */
type OpenTurnCandidate = {
  role: string;
  finishedAt?: number;
  isSyntheticTurn?: boolean;
};

export function isUnclaimedOpenTurn(params: {
  /** Re-staging over a live pendingTurn would run the turn twice. */
  hasPendingTurn: boolean;
  /**
   * The assistant bubble the turn would be recovered for. Undefined when the
   * newest message is not an assistant row at all — nothing is waiting.
   */
  lastAssistant: OpenTurnCandidate | undefined | null;
}): boolean {
  const { hasPendingTurn, lastAssistant } = params;
  if (hasPendingTurn) return false;
  if (!lastAssistant) return false;
  if (lastAssistant.role !== "assistant") return false;
  // A finished bubble already has its reply; re-staging duplicates it.
  if (lastAssistant.finishedAt !== undefined) return false;
  // Synthetic turns are the daemon's own continuations. Re-staging one only
  // spams a leftover daemon with claimPendingTurn mismatches.
  if (lastAssistant.isSyntheticTurn === true) return false;
  return true;
}
