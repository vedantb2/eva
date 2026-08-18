/**
 * Shared chip look for Quick Task modal option triggers.
 *
 * The chips are 24px tall on a pointer device, which is not a tap target. They
 * grow to the 40px floor below `sm` here rather than at each of the seven call
 * sites — and rather than via `hit-target`, because they sit 6px apart in a
 * wrapping row where the 8px bleed would let one chip open its neighbour.
 */
export const QUICK_TASK_OPTION_BADGE_CLASS =
  "inline-flex h-10 items-center gap-1.5 rounded-full bg-secondary px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:h-6";
