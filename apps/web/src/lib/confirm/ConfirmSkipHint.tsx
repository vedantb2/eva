"use client";

import { formatForDisplay, type Hotkey } from "@tanstack/react-hotkeys";
import { Kbd } from "@/lib/components/ui/Kbd";
import { cn } from "@eva/ui";
import { useAltHeld } from "./useAltHeld";

const ALT_HOTKEY = "Alt" as Hotkey;

/** Platform-native "⌥-click skips confirmation" / "Alt-click skips confirmation". */
export function skipConfirmTitle(actionTitle?: string): string {
  const skip = `${formatForDisplay(ALT_HOTKEY)}-click skips confirmation`;
  return actionTitle ? `${actionTitle} · ${skip}` : skip;
}

/**
 * Visible only while Alt is held. Sits after the action label so every
 * confirmable control shows that this click will skip the dialog.
 */
export function ConfirmSkipHint({ className }: { className?: string }) {
  const altHeld = useAltHeld();
  if (!altHeld) return null;
  return <Kbd hotkey={ALT_HOTKEY} className={cn("ml-auto shrink-0", className)} />;
}
