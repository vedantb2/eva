/**
 * Which message a finished turn's result belongs on, and which leftover bubbles
 * to drop.
 *
 * Generic over the message type so Convex docs pass straight in and tests can
 * use plain objects; only the fields the decision reads are named.
 */
type AssistantReply = {
  role: string;
  content: string;
  isSystemAlert?: boolean;
  isSyntheticTurn?: boolean;
  finishedAt?: number;
};

const SESSION_PUBLISH_FAILURE_PREFIX =
  "Session completed locally, but Eva could not publish";

/**
 * A publish failure reported after the assistant reply was already saved.
 *
 * This is not another turn result: treating it as one can overwrite a newer
 * placeholder when the user sends again while the previous branch is pushing.
 */
export function delayedPublishFailureError(
  result: string | null,
  error: string | null,
): string | undefined {
  if (
    result === null ||
    error === null ||
    !error.startsWith(SESSION_PUBLISH_FAILURE_PREFIX)
  ) {
    return undefined;
  }
  return error;
}

/**
 * The message a turn's result should be written to, given the newest messages
 * first.
 *
 * Not simply the newest: a system alert (a draft-PR failure from a previous
 * turn, say) sits as the latest assistant row and used to absorb the next
 * result, so the real reply arrived carrying someone else's errorDetail.
 * Synthetic turns are skipped for the same reason — they are Eva's own
 * continuations, not the bubble the user is waiting on.
 */
export function resultTargetMessage<M extends AssistantReply>(
  newestFirst: readonly M[],
): M | undefined {
  return newestFirst.find((message) => isOwnReply(message));
}

/**
 * Empty, unfinished assistant bubbles other than the target.
 *
 * A system alert sitting on top made the placeholder logic stage a second
 * bubble, leaving a "Working…" row that never resolved. Only empty and
 * unfinished rows qualify: anything with content or a finishedAt is real output.
 */
export function orphanPlaceholderMessages<M extends AssistantReply>(
  newestFirst: readonly M[],
  target: M,
): M[] {
  return newestFirst.filter(
    (message) =>
      message !== target &&
      isOwnReply(message) &&
      message.content === "" &&
      message.finishedAt === undefined,
  );
}

/** An assistant bubble this turn owns — not an alert, not a synthetic turn. */
function isOwnReply(message: AssistantReply): boolean {
  return (
    message.role === "assistant" &&
    message.isSystemAlert !== true &&
    message.isSyntheticTurn !== true
  );
}
