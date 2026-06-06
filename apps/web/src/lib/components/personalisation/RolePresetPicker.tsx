"use client";

import { PERSONALISATION_PRESETS } from "@conductor/backend";
import { cn } from "@conductor/ui";
import { IconBriefcase, IconCode, IconBrush } from "@tabler/icons-react";

const PRESET_ICONS = {
  business: IconBriefcase,
  dev: IconCode,
  designer: IconBrush,
} as const;

const PRESET_KEYS = ["business", "dev", "designer"] as const;

export type RolePresetKey = (typeof PRESET_KEYS)[number];

interface RolePresetPickerProps {
  activeRole: RolePresetKey | null;
  onSelect: (role: RolePresetKey | null) => void;
}

export function RolePresetPicker({
  activeRole,
  onSelect,
}: RolePresetPickerProps) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {PRESET_KEYS.map((key) => {
        const preset = PERSONALISATION_PRESETS[key];
        const Icon = PRESET_ICONS[key];
        const isActive = activeRole === key;

        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(isActive ? null : key)}
            className={cn(
              "cursor-pointer rounded-surface p-3 text-left transition-[background-color]",
              isActive
                ? "bg-accent text-accent-foreground"
                : "bg-muted/40 text-muted-foreground hover:bg-muted/60",
            )}
          >
            <div className="flex items-center gap-2">
              <Icon size={14} />
              <span className="text-xs font-medium">{preset.label}</span>
            </div>
            <p className="mt-1 text-[11px] opacity-80">{preset.description}</p>
          </button>
        );
      })}
    </div>
  );
}
