"use client";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@eva/ui";
import { IconClipboardList, IconCode, IconPalette } from "@tabler/icons-react";
import type { SessionMode } from "@/lib/hooks/useSessionSettings";

const SESSION_MODE_OPTIONS: Array<{
  value: SessionMode;
  label: string;
  icon: typeof IconCode;
}> = [
  { value: "edit", label: "Edit", icon: IconCode },
  { value: "plan", label: "Plan", icon: IconClipboardList },
  { value: "design", label: "Design", icon: IconPalette },
];

function isSessionMode(value: string): value is SessionMode {
  return SESSION_MODE_OPTIONS.some((option) => option.value === value);
}

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
        <Button
          type="button"
          variant="outline"
          size="xs"
          className="gap-1.5 bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <SelectedModeIcon className="size-3.5" />
          {selectedModeOption.label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup
          value={mode}
          onValueChange={(value) => {
            if (isSessionMode(value)) {
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
