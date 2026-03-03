"use client";

import { PageWrapper } from "@/lib/components/PageWrapper";
import {
  useThemeContext,
  ACCENT_COLORS,
  RADIUS_VALUES,
  FONT_FAMILIES,
  AccentColor,
  RadiusSize,
  FontFamily,
} from "@/lib/contexts/ThemeContext";
import { cn, Spinner } from "@conductor/ui";
import {
  IconMoon,
  IconSun,
  IconDeviceDesktop,
  IconCheck,
} from "@tabler/icons-react";
import { useTheme } from "next-themes";

const RADIUS_OPTIONS: { value: RadiusSize; label: string }[] = [
  { value: "none", label: "None" },
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "X-Large" },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
      {children}
    </p>
  );
}

export function ThemeSettingsClient() {
  const { theme, setTheme, customTheme, setCustomTheme, mounted } =
    useThemeContext();
  const { setTheme: setNextTheme } = useTheme();

  const accentColor = (customTheme.accentColor ?? "teal") as AccentColor;
  const radius = (customTheme.radius ?? "md") as RadiusSize;
  const fontFamily = (customTheme.fontFamily ?? "inter") as FontFamily;

  const handleModeChange = (mode: "light" | "dark" | "system") => {
    if (mode === "system") {
      setNextTheme("system");
    } else {
      setTheme(mode);
    }
  };

  const currentMode =
    theme === "dark" ? "dark" : theme === "light" ? "light" : "system";

  const handleAccentChange = (color: AccentColor) => {
    setCustomTheme({ ...customTheme, accentColor: color });
  };

  const handleRadiusChange = (r: RadiusSize) => {
    setCustomTheme({ ...customTheme, radius: r });
  };

  const handleFontChange = (f: FontFamily) => {
    setCustomTheme({ ...customTheme, fontFamily: f });
  };

  if (!mounted) {
    return (
      <PageWrapper title="Theme">
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Theme">
      <div className="max-w-2xl space-y-8">
        {/* Mode */}
        <section>
          <SectionLabel>Appearance</SectionLabel>
          <div className="grid grid-cols-3 gap-3">
            {(["light", "dark", "system"] as const).map((mode) => {
              const isActive = currentMode === mode;
              const Icon =
                mode === "light"
                  ? IconSun
                  : mode === "dark"
                    ? IconMoon
                    : IconDeviceDesktop;
              const label =
                mode === "light"
                  ? "Light"
                  : mode === "dark"
                    ? "Dark"
                    : "System";

              return (
                <button
                  key={mode}
                  onClick={() => handleModeChange(mode)}
                  className={cn(
                    "relative flex flex-col items-center gap-3 rounded-xl border p-4 text-sm font-medium transition-all",
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
                      "flex h-16 w-full items-center justify-center rounded-lg border",
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

        {/* Accent Color */}
        <section>
          <SectionLabel>Accent Color</SectionLabel>
          <div className="flex flex-wrap gap-3">
            {(
              Object.entries(ACCENT_COLORS) as [
                AccentColor,
                (typeof ACCENT_COLORS)[AccentColor],
              ][]
            ).map(([key, color]) => {
              const isActive = accentColor === key;
              return (
                <button
                  key={key}
                  onClick={() => handleAccentChange(key)}
                  title={color.label}
                  className={cn(
                    "group relative flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "border-primary/40 bg-primary/8 text-foreground shadow-sm ring-1 ring-primary/20"
                      : "border-border bg-card/60 text-muted-foreground hover:border-border/80 hover:bg-card hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-transform group-hover:scale-110",
                      isActive && "scale-110",
                    )}
                    style={{ backgroundColor: color.preview }}
                  >
                    {isActive && (
                      <IconCheck
                        size={11}
                        className="text-white"
                        strokeWidth={3}
                      />
                    )}
                  </span>
                  {color.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Border Radius */}
        <section>
          <SectionLabel>Border Radius</SectionLabel>
          <div className="flex flex-wrap gap-3">
            {RADIUS_OPTIONS.map(({ value, label }) => {
              const isActive = radius === value;
              const previewRadius =
                value === "none"
                  ? "0px"
                  : value === "sm"
                    ? "3px"
                    : value === "md"
                      ? "6px"
                      : value === "lg"
                        ? "10px"
                        : "14px";

              return (
                <button
                  key={value}
                  onClick={() => handleRadiusChange(value)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "border-primary/40 bg-primary/8 text-foreground shadow-sm ring-1 ring-primary/20"
                      : "border-border bg-card/60 text-muted-foreground hover:border-border/80 hover:bg-card hover:text-foreground",
                  )}
                >
                  <span
                    className="h-5 w-5 shrink-0 border-2 border-current"
                    style={{ borderRadius: previewRadius }}
                  />
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Font */}
        <section>
          <SectionLabel>Font</SectionLabel>
          <div className="flex flex-wrap gap-3">
            {(
              Object.entries(FONT_FAMILIES) as [
                FontFamily,
                (typeof FONT_FAMILIES)[FontFamily],
              ][]
            ).map(([key, font]) => {
              const isActive = fontFamily === key;
              return (
                <button
                  key={key}
                  onClick={() => handleFontChange(key)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "border-primary/40 bg-primary/8 text-foreground shadow-sm ring-1 ring-primary/20"
                      : "border-border bg-card/60 text-muted-foreground hover:border-border/80 hover:bg-card hover:text-foreground",
                  )}
                >
                  {isActive && (
                    <IconCheck
                      size={14}
                      className="shrink-0 text-primary"
                      strokeWidth={2.5}
                    />
                  )}
                  <span style={{ fontFamily: font.stack }}>{font.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Preview */}
        <section>
          <SectionLabel>Preview</SectionLabel>
          <div className="rounded-xl border border-border/70 bg-card/80 p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: ACCENT_COLORS[accentColor].preview }}
              />
              <p className="text-sm font-semibold text-foreground">
                {ACCENT_COLORS[accentColor].label} &middot;{" "}
                {RADIUS_OPTIONS.find((r) => r.value === radius)?.label} radius
                &middot; {FONT_FAMILIES[fontFamily].label} &middot;{" "}
                {currentMode.charAt(0).toUpperCase() + currentMode.slice(1)}{" "}
                mode
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90">
                Primary button
              </button>
              <button className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent">
                Secondary button
              </button>
              <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                Badge
              </span>
              <span className="text-xs text-muted-foreground">Muted text</span>
            </div>
          </div>
        </section>
      </div>
    </PageWrapper>
  );
}
