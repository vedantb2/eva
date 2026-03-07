"use client";

import { ACCENT_COLORS } from "@/lib/contexts/ThemeContext";
import type { AccentColor } from "@/lib/contexts/ThemeContext";
import { cn } from "@conductor/ui";
import { IconCheck } from "@tabler/icons-react";
import { SectionLabel } from "./SectionLabel";
import { OptionButton } from "./OptionButton";

export function AccentColorSection({
  accentColor,
  onAccentChange,
}: {
  accentColor: AccentColor;
  onAccentChange: (color: AccentColor) => void;
}) {
  return (
    <section>
      <SectionLabel>Accent Color</SectionLabel>
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {(
          Object.entries(ACCENT_COLORS) as [
            AccentColor,
            (typeof ACCENT_COLORS)[AccentColor],
          ][]
        ).map(([key, color]) => {
          const isActive = accentColor === key;
          return (
            <OptionButton
              key={key}
              active={isActive}
              onClick={() => onAccentChange(key)}
              title={color.label}
              className="group relative"
            >
              <span
                className={cn(
                  "relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-transform group-hover:scale-110",
                  isActive && "scale-110",
                )}
                style={{ backgroundColor: color.preview }}
              >
                {isActive && (
                  <IconCheck size={11} className="text-white" strokeWidth={3} />
                )}
              </span>
              {color.label}
            </OptionButton>
          );
        })}
      </div>
    </section>
  );
}
