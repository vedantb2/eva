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
}: {
  currentMode: Mode;
  onModeChange: (mode: Mode) => void;
}) {
  return (
    <section>
      <SectionLabel>Appearance</SectionLabel>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
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
                "relative flex flex-col items-center gap-2 rounded-xl border p-3 text-xs font-medium transition-all sm:gap-3 sm:p-4 sm:text-sm",
                isActive
                  ? "border-primary bg-primary/8 text-primary shadow-sm ring-1 ring-primary/20"
                  : "border-border bg-card/60 text-muted-foreground hover:border-border/80 hover:bg-card hover:text-foreground",
              )}
            >
              {isActive && (
                <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <IconCheck size={10} strokeWidth={3} />
                </span>
              )}
              <div
                className={cn(
                  "flex h-12 w-full items-center justify-center rounded-lg border sm:h-16",
                  mode === "light"
                    ? "border-border/60 bg-white"
                    : mode === "dark"
                      ? "border-border/60 bg-zinc-900"
                      : "border-border/60 bg-gradient-to-br from-white to-zinc-900",
                )}
              >
                <Icon
                  size={22}
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
