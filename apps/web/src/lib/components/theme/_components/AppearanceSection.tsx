"use client";

import { cn } from "@conductor/ui";
import {
  IconMoon,
  IconSun,
  IconDeviceDesktop,
  IconCheck,
} from "@tabler/icons-react";
import { SectionLabel } from "./SectionLabel";

type Mode = "light" | "dark" | "system";

export function AppearanceSection({
  currentMode,
  onModeChange,
  compact = false,
}: {
  currentMode: Mode;
  onModeChange: (mode: Mode) => void;
  compact?: boolean;
}) {
  return (
    <section>
      <SectionLabel>Appearance</SectionLabel>
      <div
        className={cn(
          "grid grid-cols-3",
          compact ? "gap-1.5" : "gap-2 sm:gap-3",
        )}
      >
        {(["light", "dark", "system"] as const).map((mode) => {
          const isActive = currentMode === mode;
          const Icon =
            mode === "light"
              ? IconSun
              : mode === "dark"
                ? IconMoon
                : IconDeviceDesktop;
          const label =
            mode === "light" ? "Light" : mode === "dark" ? "Dark" : "System";

          return (
            <button
              key={mode}
              onClick={() => onModeChange(mode)}
              className={cn(
                "relative flex flex-col items-center rounded-surface font-medium motion-press transition-[background-color,color,transform] active:scale-[0.96]",
                compact
                  ? "gap-1 p-2 text-[11px]"
                  : "gap-2 p-3 text-xs sm:gap-3 sm:p-4 sm:text-sm",
                isActive
                  ? "bg-primary/8 text-primary ring-1 ring-primary/20"
                  : "bg-card/60 text-muted-foreground hover:bg-muted/60 hover:text-foreground",
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
    </section>
  );
}
