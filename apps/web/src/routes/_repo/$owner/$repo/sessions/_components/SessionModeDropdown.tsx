"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@conductor/ui";
import { IconClipboardList, IconCode } from "@tabler/icons-react";
import type { SessionMode } from "@/lib/hooks/useSessionSettings";

const SESSION_MODE_OPTIONS: Array<{
  value: SessionMode;
  label: string;
  icon: typeof IconCode;
}> = [
  { value: "edit", label: "Edit", icon: IconCode },
  { value: "plan", label: "PRD", icon: IconClipboardList },
];

interface SessionModeDropdownProps {
  mode: SessionMode;
  onModeChange: (mode: SessionMode) => void;
}

export function SessionModeDropdown({
  mode,
  onModeChange,
}: SessionModeDropdownProps) {
  const selectedModeOption =
    SESSION_MODE_OPTIONS.find((option) => option.value === mode) ??
    SESSION_MODE_OPTIONS[0];
  const SelectedModeIcon = selectedModeOption.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50">
          <SelectedModeIcon className="size-3.5" />
          {selectedModeOption.label}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup
          value={mode}
          onValueChange={(value) => {
            if (value === "edit" || value === "plan") {
              onModeChange(value);
            }
          }}
        >
          {SESSION_MODE_OPTIONS.map((option) => {
            const ModeIcon = option.icon;
            return (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                <ModeIcon size={14} />
                {option.label}
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
