"use client";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  Command,
  CommandList,
  CommandGroup,
  CommandItem,
} from "@conductor/ui";
import { IconCamera, IconCameraOff, IconCheck } from "@tabler/icons-react";

export type ScreenshotsToggleValue = boolean | undefined;

interface ScreenshotsToggleProps {
  value: ScreenshotsToggleValue;
  repoDefault: boolean;
  onChange: (next: ScreenshotsToggleValue) => void;
  disabled?: boolean;
}

/**
 * Tri-state per-task override for the repo-level screenshots/videos setting.
 * - `undefined` = inherit repo (label shows current repo state)
 * - `true` = force on for this task
 * - `false` = force off for this task
 */
export function ScreenshotsToggle({
  value,
  repoDefault,
  onChange,
  disabled,
}: ScreenshotsToggleProps) {
  const isOverride = value !== undefined;
  const effective = value ?? repoDefault;
  const Icon = effective ? IconCamera : IconCameraOff;
  const label = isOverride
    ? value
      ? "Proof: on"
      : "Proof: off"
    : `Proof: inherit (${repoDefault ? "on" : "off"})`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon size={14} />
          <span className={isOverride ? "text-foreground" : ""}>{label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-0">
        <Command>
          <CommandList>
            <CommandGroup>
              <CommandItem value="inherit" onSelect={() => onChange(undefined)}>
                <IconCamera size={14} className="text-muted-foreground" />
                Inherit ({repoDefault ? "on" : "off"})
                {value === undefined && (
                  <IconCheck size={14} className="ml-auto" />
                )}
              </CommandItem>
              <CommandItem value="force-on" onSelect={() => onChange(true)}>
                <IconCamera size={14} className="text-muted-foreground" />
                Force on
                {value === true && <IconCheck size={14} className="ml-auto" />}
              </CommandItem>
              <CommandItem value="force-off" onSelect={() => onChange(false)}>
                <IconCameraOff size={14} className="text-muted-foreground" />
                Force off
                {value === false && <IconCheck size={14} className="ml-auto" />}
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
