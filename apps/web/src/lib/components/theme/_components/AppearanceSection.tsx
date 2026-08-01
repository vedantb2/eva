"use client";

import { cn } from "@eva/ui";
import type { ThemeMode } from "@/lib/hooks/useThemeMode";
import {
  IconMoon,
  IconSun,
  IconDeviceDesktop,
  IconCircleHalf,
  IconCheck,
} from "@tabler/icons-react";

const MODES = [
  "light",
  "neutral",
  "dark",
  "system",
] as const satisfies readonly ThemeMode[];

export function AppearanceSection({
  currentMode,
  onModeChange,
  compact = false,
}: {
  currentMode: ThemeMode;
  onModeChange: (mode: ThemeMode) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={cn("grid grid-cols-2", compact ? "gap-1.5" : "gap-2 sm:gap-3")}
    >
      {MODES.map((mode) => {
        const isActive = currentMode === mode;
        const Icon =
          mode === "light"
            ? IconSun
            : mode === "neutral"
              ? IconCircleHalf
              : mode === "dark"
                ? IconMoon
                : IconDeviceDesktop;
        const label =
          mode === "light"
            ? "Light"
            : mode === "neutral"
              ? "Neutral"
              : mode === "dark"
                ? "Dark"
                : "System";

        return (
          <button
            key={mode}
            onClick={() => onModeChange(mode)}
            className={cn(
              // The border carries the selected state, so inactive tiles keep a
              // transparent one to hold their size.
              "relative flex flex-col items-center rounded-surface border font-medium motion-press transition-[background-color,border-color,color,transform] active:scale-[0.96]",
              compact
                ? "gap-1 p-2 text-2xs"
                : "gap-2 p-3 text-xs sm:gap-3 sm:p-4 sm:text-sm",
              isActive
                ? "border-border bg-primary/8 text-primary"
                : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            {isActive ? (
              <span
                className={cn(
                  "absolute flex items-center justify-center rounded-full bg-primary text-primary-foreground",
                  compact
                    ? "right-1 top-1 h-3.5 w-3.5"
                    : "right-2 top-2 h-4 w-4",
                )}
              >
                <IconCheck size={compact ? 8 : 10} strokeWidth={3} />
              </span>
            ) : null}
            <div
              className={cn(
                "flex w-full items-center justify-center rounded-lg",
                compact ? "h-8" : "h-12 sm:h-16",
                mode === "light"
                  ? "bg-white"
                  : mode === "neutral"
                    ? "bg-zinc-700"
                    : mode === "dark"
                      ? "bg-zinc-900"
                      : "bg-gradient-to-br from-white to-zinc-900",
              )}
            >
              <Icon
                size={compact ? 14 : 22}
                className={
                  mode === "light"
                    ? "text-amber-500"
                    : mode === "neutral"
                      ? "text-zinc-300"
                      : mode === "dark"
                        ? "text-blue-300"
                        : "text-muted-foreground"
                }
              />
            </div>
            {label}
          </button>
        );
      })}
    </div>
  );
}
