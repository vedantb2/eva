"use client";

import { ACCENT_COLORS, CURATED_ACCENT_COLORS } from "@/lib/contexts/ThemeContext";
import type { AccentColor } from "@/lib/contexts/ThemeContext";
import { cn } from "@eva/ui";
import { IconCheck } from "@tabler/icons-react";
import { OptionButton } from "./OptionButton";

export function AccentColorSection({
  accentColor,
  onAccentChange,
}: {
  accentColor: AccentColor;
  onAccentChange: (color: AccentColor) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 sm:gap-3">
      {CURATED_ACCENT_COLORS.map((key) => {
        const color = ACCENT_COLORS[key];
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
                "relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border/40 transition-transform group-hover:scale-110",
                isActive && "scale-110",
                key === "zinc" && "bg-zinc-900 dark:bg-zinc-100",
              )}
              style={
                key === "zinc" ? undefined : { backgroundColor: color.preview }
              }
            >
              {isActive && (
                <IconCheck
                  size={11}
                  className={
                    key === "zinc"
                      ? "text-white dark:text-zinc-900"
                      : color.checkDark
                        ? "text-zinc-900"
                        : "text-white"
                  }
                  strokeWidth={3}
                />
              )}
            </span>
            {color.label}
          </OptionButton>
        );
      })}
    </div>
  );
}
