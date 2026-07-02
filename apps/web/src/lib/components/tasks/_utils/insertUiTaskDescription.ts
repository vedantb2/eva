import { UI_TASK_DESCRIPTION_TEMPLATE } from "@conductor/shared";

/** Prepends or replaces description text with the UI task markdown scaffold. */
export function insertUiTaskDescriptionTemplate(current: string): string {
  const trimmed = current.trim();
  if (!trimmed) {
    return UI_TASK_DESCRIPTION_TEMPLATE;
  }
  return `${trimmed}\n\n${UI_TASK_DESCRIPTION_TEMPLATE}`;
}
