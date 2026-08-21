/**
 * How a submitted review is reported back, in one place. Two surfaces post
 * reviews — the header's verdict menu and the Diffs toolbar's "Review changes"
 * popover — and a reader who approves from one and requests changes from the
 * other should not be told about it in two different vocabularies.
 *
 * Keyed off the state GitHub returns rather than the event that was sent, so a
 * verdict GitHub declined to record cannot be announced as though it had been.
 */
export function verdictSuccessTitle(state: string): string {
  if (state === "APPROVED") return "Pull request approved";
  if (state === "CHANGES_REQUESTED") return "Changes requested";
  return "Review posted";
}
