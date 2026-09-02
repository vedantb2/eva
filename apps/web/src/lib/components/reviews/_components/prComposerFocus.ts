import type { ReviewTab } from "@/lib/search-params";

/**
 * The comment box's element id, so a control outside the Activity panel can put
 * the cursor in it. Keyed by pull request number because every review panel is
 * force-mounted — two of them on one page would otherwise share an id.
 */
export function prComposerId(prNumber: number): string {
  return `pr-comment-${prNumber}`;
}

/**
 * Reveal the comment box and put the cursor in it, from anywhere on the surface.
 *
 * The panels are force-mounted but the inactive ones are `hidden`, and neither
 * `focus()` nor `scrollIntoView()` does anything to a `display: none` subtree —
 * so the tab switch has to land first. One frame is enough (React commits the
 * class change synchronously with the paint that follows), and a frame is
 * cheaper here than a context threaded through five components for a cursor.
 */
export function focusPrComposer(
  prNumber: number,
  goToTab: (tab: ReviewTab) => void,
): void {
  goToTab("overview");
  requestAnimationFrame(() => {
    const node = document.getElementById(prComposerId(prNumber));
    if (node === null) return;
    node.scrollIntoView({ behavior: "smooth", block: "center" });
    node.focus({ preventScroll: true });
  });
}
