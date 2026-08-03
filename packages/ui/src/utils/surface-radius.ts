/**
 * Radius utilities for theme-aware corners. "Full" sets --radius to 9999px.
 *
 * Every surface and control uses the clamped tokens below — there is no
 * exception for compact rows. Raw `rounded-sm|md|lg|xl|2xl` and
 * `rounded-[...]` are banned outside packages/ui: unclamped, they would
 * render as pills under the "Full" radius theme, which is drift, not intent.
 *
 * Caps: controls (inputs, buttons, list rows) top out at 10px, surfaces
 * (cards, dialogs, dropdown panels) sit in the 12-16px band, menu items
 * top out at 8px.
 *
 * Uses globals.css utilities for capped tokens — not Tailwind arbitrary
 * values — so class extraction never drops commas inside clamp().
 */

/** Cards, dialogs, dropdown panels, kanban columns, alerts, calendars. */
export const SURFACE_RADIUS_CLASS = "rounded-surface";

/** Inputs, textareas, selects, input groups. */
export const CONTROL_RADIUS_CLASS = "rounded-control";

/** Streamdown table-wrapper uses rounded-lg; inner scroll div uses rounded-md. */
export const STREAMDOWN_TABLE_RADIUS_CLASS =
  "[&_[data-streamdown=table-wrapper]]:rounded-surface [&_[data-streamdown=table-wrapper]>div]:rounded-surface";
