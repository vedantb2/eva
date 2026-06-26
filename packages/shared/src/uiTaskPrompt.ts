/** Markdown scaffold for UI tasks — paste into the task description so the agent knows where to look. */
export const UI_TASK_DESCRIPTION_TEMPLATE = `## Route
/e.g. /domcare/users-may

## Control
e.g. "Profile type" filter in the filter bar — not the Edit user modal

## Acceptance
Scrollbar always visible when the option list overflows.

## Notes
(Optional sandbox preview URL or screenshot link)
`;

export const UI_TASK_DESCRIPTION_HINT =
  "For UI work: add Route, Control, and Acceptance (use “Add UI details” when creating the task).";

const UI_TASK_SECTION_MARKERS = ["## route", "## control", "## acceptance"];

const UI_TASK_KEYWORDS = [
  "dropdown",
  "select",
  "filter",
  "modal",
  "dialog",
  "drawer",
  "popover",
  "tooltip",
  "button",
  "badge",
  "tab",
  "table",
  "header",
  "row",
  "column",
  "page",
  "screen",
  "layout",
  "style",
  "align",
  "padding",
  "margin",
  "font",
  "scroll",
  "scrollbar",
  "hover",
  "colour",
  "color",
  "icon",
  "chip",
  "banner",
  "toast",
  "pagination",
  "sidebar",
  "form",
  "input",
  "checkbox",
  "toggle",
  "design",
  "visible",
  "display",
  "render",
  "ui",
  "ux",
] as const;

/** True when the task title/description looks like a user-facing UI change. */
export function isUiImplementationTask(input: {
  title: string;
  description?: string;
}): boolean {
  const combined = `${input.title}\n${input.description ?? ""}`.toLowerCase();
  if (UI_TASK_SECTION_MARKERS.some((marker) => combined.includes(marker))) {
    return true;
  }
  return UI_TASK_KEYWORDS.some((keyword) => combined.includes(keyword));
}
