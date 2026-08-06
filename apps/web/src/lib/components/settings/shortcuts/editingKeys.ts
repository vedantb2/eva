import { type Hotkey } from "@tanstack/react-hotkeys";

/**
 * Keys handled by a focused input, list, or dialog rather than registered
 * globally. They are listed for reference only: rebinding Enter or Escape
 * inside a text field breaks form accessibility and IME composition, so these
 * stay fixed.
 */
export const EDITING_KEYS: ReadonlyArray<{
  keys: ReadonlyArray<Hotkey>;
  description: string;
}> = [
  { keys: ["Enter"], description: "Send the message, or confirm the dialog." },
  { keys: ["Shift+Enter"], description: "Insert a newline in the composer." },
  {
    keys: ["Escape"],
    description: "Close the dialog, menu, or lightbox, or cancel the edit.",
  },
  {
    keys: ["Backspace"],
    description: "With an empty composer, remove the last attachment.",
  },
  {
    keys: ["Alt+ArrowUp", "Alt+ArrowDown"],
    description: "Step back and forward through your recent prompts.",
  },
  {
    keys: ["Tab"],
    description: "Accept the inline completion when one is offered.",
  },
  {
    keys: ["ArrowUp", "ArrowDown"],
    description: "Move through a list, menu, or mention picker.",
  },
  {
    keys: ["ArrowLeft", "ArrowRight"],
    description: "Move between images in the lightbox.",
  },
];
