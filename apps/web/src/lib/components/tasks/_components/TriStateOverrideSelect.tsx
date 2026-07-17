"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectLabel,
  SelectGroup,
} from "@conductor/ui";
import type { IconProps } from "@tabler/icons-react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";
import {
  GHOST_TRIGGER_CLASS,
  SCREENSHOTS_INHERIT_VALUE,
  SCREENSHOTS_ON_VALUE,
  SCREENSHOTS_OFF_VALUE,
} from "./task-detail-constants";

type TablerIcon = ForwardRefExoticComponent<
  IconProps & RefAttributes<SVGSVGElement>
>;

interface TriStateOverrideSelectProps {
  /** Short noun shown in the trigger, e.g. "Proof" or "Audit". */
  label: string;
  /** Heading shown above the options. */
  groupLabel: string;
  /** undefined = inherit, true = force on, false = force off. */
  value: boolean | undefined;
  /** Resolved value used to render the inherited state. */
  inheritedDefault: boolean;
  onIcon: TablerIcon;
  offIcon: TablerIcon;
  /** null clears the override (inherit); true/false force the value. */
  onChange: (next: boolean | null) => void;
}

/**
 * Tri-state override rendered as a ghost Select, matching the task-detail
 * sidebar rows. Shared by the Proof and Audit controls so they stay identical.
 */
export function TriStateOverrideSelect({
  label,
  groupLabel,
  value,
  inheritedDefault,
  onIcon: OnIcon,
  offIcon: OffIcon,
  onChange,
}: TriStateOverrideSelectProps) {
  const selectValue =
    value === undefined
      ? SCREENSHOTS_INHERIT_VALUE
      : value
        ? SCREENSHOTS_ON_VALUE
        : SCREENSHOTS_OFF_VALUE;
  const inheritedWord = inheritedDefault ? "on" : "off";

  return (
    <Select
      value={selectValue}
      onValueChange={(val) => {
        if (val === SCREENSHOTS_INHERIT_VALUE) onChange(null);
        else if (val === SCREENSHOTS_ON_VALUE) onChange(true);
        else if (val === SCREENSHOTS_OFF_VALUE) onChange(false);
      }}
    >
      <SelectTrigger className={GHOST_TRIGGER_CLASS}>
        <SelectValue>
          {(() => {
            const isOverride = value !== undefined;
            const effective = value ?? inheritedDefault;
            const Icon = effective ? OnIcon : OffIcon;
            return (
              <div
                className={`flex items-center gap-1.5 ${isOverride ? "" : "text-muted-foreground"}`}
              >
                <Icon size={14} className="text-muted-foreground" />
                <span>
                  {isOverride
                    ? value
                      ? `${label}: on`
                      : `${label}: off`
                    : `${label}: inherit (${inheritedWord})`}
                </span>
              </div>
            );
          })()}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>{groupLabel}</SelectLabel>
          <SelectItem value={SCREENSHOTS_INHERIT_VALUE}>
            <div className="flex items-center gap-1.5">
              <OnIcon size={14} className="text-muted-foreground" />
              <span>Inherit ({inheritedWord})</span>
            </div>
          </SelectItem>
          <SelectItem value={SCREENSHOTS_ON_VALUE}>
            <div className="flex items-center gap-1.5">
              <OnIcon size={14} className="text-muted-foreground" />
              <span>Force on</span>
            </div>
          </SelectItem>
          <SelectItem value={SCREENSHOTS_OFF_VALUE}>
            <div className="flex items-center gap-1.5">
              <OffIcon size={14} className="text-muted-foreground" />
              <span>Force off</span>
            </div>
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
