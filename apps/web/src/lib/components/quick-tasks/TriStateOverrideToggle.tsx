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
import { IconCheck, type IconProps } from "@tabler/icons-react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";

export type TriStateValue = boolean | undefined;

type TablerIcon = ForwardRefExoticComponent<
  IconProps & RefAttributes<SVGSVGElement>
>;

interface TriStateOverrideToggleProps {
  /** Short noun shown in the label, e.g. "Proof" or "Audit". */
  label: string;
  value: TriStateValue;
  /** Resolved value used when the override is `undefined` (inherited). */
  inheritedDefault: boolean;
  onChange: (next: TriStateValue) => void;
  onIcon: TablerIcon;
  offIcon: TablerIcon;
  disabled?: boolean;
}

/**
 * Tri-state per-entity override control rendered as a popover.
 * - `undefined` = inherit the default (label shows the inherited state)
 * - `true` = force on
 * - `false` = force off
 * Shared by the Proof and Audit toggles so they stay visually identical.
 */
export function TriStateOverrideToggle({
  label,
  value,
  inheritedDefault,
  onChange,
  onIcon: OnIcon,
  offIcon: OffIcon,
  disabled,
}: TriStateOverrideToggleProps) {
  const isOverride = value !== undefined;
  const effective = value ?? inheritedDefault;
  const Icon = effective ? OnIcon : OffIcon;
  const inheritedWord = inheritedDefault ? "on" : "off";
  const text = isOverride
    ? value
      ? `${label}: on`
      : `${label}: off`
    : `${label}: inherit (${inheritedWord})`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon size={14} />
          <span className={isOverride ? "text-foreground" : ""}>{text}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-0">
        <Command>
          <CommandList>
            <CommandGroup>
              <CommandItem value="inherit" onSelect={() => onChange(undefined)}>
                <OnIcon size={14} className="text-muted-foreground" />
                Inherit ({inheritedWord})
                {value === undefined && (
                  <IconCheck size={14} className="ml-auto" />
                )}
              </CommandItem>
              <CommandItem value="force-on" onSelect={() => onChange(true)}>
                <OnIcon size={14} className="text-muted-foreground" />
                Force on
                {value === true && <IconCheck size={14} className="ml-auto" />}
              </CommandItem>
              <CommandItem value="force-off" onSelect={() => onChange(false)}>
                <OffIcon size={14} className="text-muted-foreground" />
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
