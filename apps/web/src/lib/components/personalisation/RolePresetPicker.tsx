"use client";

import { PERSONALISATION_PRESETS } from "@eva/backend";
import { ListRow } from "@eva/ui";
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
          <ListRow
            key={key}
            selected={isActive}
            onClick={() => onSelect(isActive ? null : key)}
            aria-label={preset.label}
          >
            <div className="flex items-center gap-2">
              <Icon size={14} className="shrink-0" />
              <span className="text-2sm font-medium">{preset.label}</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {preset.description}
            </p>
          </ListRow>
        );
      })}
    </div>
  );
}
