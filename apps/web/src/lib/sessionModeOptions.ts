import {
  IconClipboardList,
  IconCode,
  IconPalette,
  type Icon,
} from "@tabler/icons-react";
import type { SessionMode } from "@/lib/hooks/useSessionSettings";

export const SESSION_MODE_OPTIONS: Array<{
  value: SessionMode;
  label: string;
  icon: Icon;
}> = [
  { value: "edit", label: "Edit", icon: IconCode },
  { value: "plan", label: "Plan", icon: IconClipboardList },
  { value: "design", label: "Design", icon: IconPalette },
];

export function isSessionMode(value: string): value is SessionMode {
  return SESSION_MODE_OPTIONS.some((option) => option.value === value);
}
