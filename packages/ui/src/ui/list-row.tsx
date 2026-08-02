import * as React from "react";

import { cn } from "../utils/cn";
import { SURFACE_RADIUS_CLASS } from "../utils/surface-radius";

/**
 * Apply to any interactive control nested inside a `<ListRow>` — a checkbox, a
 * menu trigger, a dismiss button. It lifts the control above the row's stretched
 * click overlay so the control receives its own clicks instead of the row's.
 */
export const LIST_ROW_CONTROL_CLASS = "relative z-[2]";

/**
 * The shell every selectable list row shares: surface, hairline, accent stripe,
 * hover, selected state, press feedback, and focus ring.
 *
 * Three rows had hand-rolled this — project, quick task, notification — and they
 * had drifted on every one of those: 200ms vs 150ms, `w-1` vs `w-[3px]`,
 * `inset-y-2` vs `inset-y-1.5`, press feedback present or absent. Side by side
 * they read as three components rather than three instances of one.
 *
 * ## Why a stretched overlay rather than a wrapping button
 *
 * The obvious shape — make the whole row a `<button>` — is unusable here,
 * because these rows embed their own controls: a selection checkbox, tooltip
 * triggers, a dismiss action. A button inside a button is invalid HTML, and the
 * inner control never receives its clicks. That is exactly why the existing rows
 * reached for `role="button" tabIndex={0}` on a div, which then needed a
 * hand-written `Enter`/`Space` key handler and an `if (e.detail === 0) return`
 * guard to stop that handler firing twice.
 *
 * So the row body stays a plain `<div>`, and a real `<button>` (or `<a>`, given
 * `href`) is stretched across it at `z-[1]`. The native element supplies the
 * keyboard behaviour, the accessible role, and — for `<a>` — middle-click and
 * Cmd-click, which both cards previously reimplemented with `window.open`.
 * Nested controls opt above the overlay with {@link LIST_ROW_CONTROL_CLASS}.
 *
 * The focus ring is drawn by the row, not the overlay. Rows clip their
 * decoration with `overflow-hidden` and a ring is a box-shadow, so a ring on the
 * overlay would be clipped away and keyboard focus would be invisible. The
 * `has-[…]` selector is scoped to the overlay's `data-slot` so a focused nested
 * control does not also light up the whole row.
 */
export interface ListRowProps {
  children: React.ReactNode;
  /**
   * Background class for the 4px stripe down the leading edge — the row's
   * status colour. Omit for rows that carry no status.
   */
  accentClassName?: string;
  /** Current row. Fills the surface and recolours the hairline. */
  selected?: boolean;
  /**
   * Renders the overlay as an `<a>`, so the row supports middle-click and
   * Cmd-click for free. `onClick` still fires for plain clicks, which is how a
   * row both navigates and updates local state.
   */
  href?: string;
  /** Omit along with `href` for a row that is display-only. */
  onClick?: () => void;
  /** Names the row for screen readers, since the overlay has no text of its own. */
  "aria-label"?: string;
  className?: string;
  /** Padding for the row body. Defaults to the standard row inset. */
  contentClassName?: string;
  /** Content layered behind the row body, such as a hover glow. */
  decoration?: React.ReactNode;
}

function ListRow({
  children,
  accentClassName,
  selected = false,
  href,
  onClick,
  className,
  contentClassName,
  decoration,
  "aria-label": ariaLabel,
}: ListRowProps) {
  const interactive = href !== undefined || onClick !== undefined;

  const overlayClasses =
    "absolute inset-0 z-[1] cursor-pointer focus-visible:outline-none";

  return (
    <div
      className={cn(
        "group relative overflow-hidden",
        SURFACE_RADIUS_CLASS,
        "border border-border shadow-sm transition-[transform,background-color] duration-200 ease-[var(--motion-ease-out)]",
        "has-[[data-slot=row-control]:focus-visible]:ring-2 has-[[data-slot=row-control]:focus-visible]:ring-ring/35",
        interactive && "active:scale-[0.99]",
        selected
          ? "border-primary/30 bg-primary/5 ring-1 ring-primary/30"
          : "bg-card hover:bg-muted/40",
        className,
      )}
    >
      {decoration}
      {accentClassName ? (
        <div
          className={cn(
            "absolute inset-y-2 left-0 w-1 rounded-r-full",
            accentClassName,
          )}
        />
      ) : null}
      {href !== undefined ? (
        <a
          href={href}
          onClick={(event) => {
            if (onClick === undefined) return;
            // A modified click is the entire reason this is an `<a>` — let the
            // browser open the new tab or window itself. A plain click is
            // handled in-app, so the navigation has to be cancelled or the
            // row would also hard-reload the page out from under the router.
            if (
              event.metaKey ||
              event.ctrlKey ||
              event.shiftKey ||
              event.altKey
            ) {
              return;
            }
            event.preventDefault();
            onClick();
          }}
          data-slot="row-control"
          aria-label={ariaLabel}
          className={overlayClasses}
        />
      ) : onClick !== undefined ? (
        <button
          type="button"
          onClick={onClick}
          data-slot="row-control"
          aria-label={ariaLabel}
          className={overlayClasses}
        />
      ) : null}
      <div className={cn("relative p-2.5 pl-3 text-left", contentClassName)}>
        {children}
      </div>
    </div>
  );
}

export { ListRow };
