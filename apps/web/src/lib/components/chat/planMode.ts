import type { InteractionMode } from "@eva/backend";

/** Standalone `/plan` or `/build` in the composer toggles mode instead of sending. */
export function parseComposerModeSlash(
  text: string,
): InteractionMode | null {
  const command = text.trim().toLowerCase();
  if (command === "/plan") return "plan";
  if (command === "/build" || command === "/default") return "default";
  return null;
}
