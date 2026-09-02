/**
 * The one definition of "this recap is really ready".
 *
 * `prRecapStatus: "ready"` cannot express that the HTML walkthrough actually
 * arrived, so ready-with-no-html was a storable illegal state (a model that
 * returned narration instead of HTML). The write path now enforces the
 * invariant here, and the recap views read the same helper so a row written
 * before enforcement still renders as a failure rather than a blank tab.
 *
 * Dependency-free on purpose: imported by Convex mutations, by the workflow,
 * and by the web app through `@eva/backend`.
 */

type PrRecapStatus = "pending" | "ready" | "error";

/** Stored on the recap doc when the model response is not a complete recap. */
export const INCOMPLETE_PR_RECAP_ERROR =
  "We couldn't generate a complete recap. Generate again to retry.";

/** Shown by the recap views for a doc that failed the ready invariant. */
export const INCOMPLETE_PR_RECAP_MESSAGE =
  "The walkthrough wasn't saved. Generate again to retry.";

/** A recap is only viewable when it carries a non-blank HTML walkthrough. */
function hasRecapWalkthrough(html: string | undefined): boolean {
  return html !== undefined && html.trim() !== "";
}

/**
 * A doc stored "ready" without a walkthrough — the illegal state this module
 * exists to name. New writes cannot produce it; older rows still can.
 */
export function isIncompleteReadyRecap(doc: {
  prRecapStatus?: PrRecapStatus;
  html?: string;
}): boolean {
  return doc.prRecapStatus === "ready" && !hasRecapWalkthrough(doc.html);
}

/** A recap the reader can actually open: ready and carrying its walkthrough. */
export function isViewableRecap(doc: {
  prRecapStatus?: PrRecapStatus;
  html?: string;
}): boolean {
  return doc.prRecapStatus === "ready" && hasRecapWalkthrough(doc.html);
}

/**
 * Normalises the status/error pair a write is about to store. "ready" without a
 * walkthrough becomes an error so the doc never claims a recap it cannot show;
 * a genuine "ready" drops any stale error text.
 */
export function resolvePrRecapWrite(input: {
  prRecapStatus: PrRecapStatus;
  html: string | undefined;
  prRecapError: string | undefined;
}): { prRecapStatus: PrRecapStatus; prRecapError: string | undefined } {
  if (input.prRecapStatus === "ready") {
    return hasRecapWalkthrough(input.html)
      ? { prRecapStatus: "ready", prRecapError: undefined }
      : {
          prRecapStatus: "error",
          prRecapError: input.prRecapError ?? INCOMPLETE_PR_RECAP_ERROR,
        };
  }
  return {
    prRecapStatus: input.prRecapStatus,
    prRecapError: input.prRecapError,
  };
}
