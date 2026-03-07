"use client";

import { PageWrapper } from "@/lib/components/PageWrapper";
import {
  useThemeContext,
  resolveCustomTheme,
  ACCENT_COLORS,
  RADIUS_VALUES,
  FONT_FAMILIES,
  LETTER_SPACING_VALUES,
} from "@/lib/contexts/ThemeContext";
import type {
  AccentColor,
  RadiusSize,
  FontFamily,
  LetterSpacing,
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

const LETTER_SPACING_OPTIONS: { value: LetterSpacing; label: string }[] = [
  { value: "tighter", label: "Tighter" },
  { value: "tight", label: "Tight" },
  { value: "normal", label: "Normal" },
  { value: "wide", label: "Wide" },
  { value: "wider", label: "Wider" },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
      {children}
    </p>
  );
}

function OptionButton({
  active,
  onClick,
  children,
  className,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-medium transition-all sm:gap-2.5 sm:px-3.5 sm:py-2.5 sm:text-sm",
        active
          ? "border-primary/40 bg-primary/8 text-foreground shadow-sm ring-1 ring-primary/20"
          : "border-border bg-card/60 text-muted-foreground hover:border-border/80 hover:bg-card hover:text-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function ThemeSettingsClient() {
  const { theme, setTheme, customTheme, setCustomTheme, mounted } =
    useThemeContext();
  const { setTheme: setNextTheme } = useTheme();

  const resolved = resolveCustomTheme(customTheme);
  const { accentColor, radius, fontFamily, letterSpacing } = resolved;

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

  const handleLetterSpacingChange = (ls: LetterSpacing) => {
    setCustomTheme({ ...customTheme, letterSpacing: ls });
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
      <div className="max-w-2xl space-y-6 sm:space-y-8">
        {/* Mode */}
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

        {/* Accent Color */}
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
                  onClick={() => handleAccentChange(key)}
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
                      <IconCheck
                        size={11}
                        className="text-white"
                        strokeWidth={3}
                      />
                    )}
                  </span>
                  {color.label}
                </OptionButton>
              );
            })}
          </div>
        </section>

        {/* Border Radius */}
        <section>
          <SectionLabel>Border Radius</SectionLabel>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {RADIUS_OPTIONS.map(({ value, label }) => {
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
                <OptionButton
                  key={value}
                  active={radius === value}
                  onClick={() => handleRadiusChange(value)}
                >
                  <span
                    className="h-5 w-5 shrink-0 border-2 border-current"
                    style={{ borderRadius: previewRadius }}
                  />
                  {label}
                </OptionButton>
              );
            })}
          </div>
        </section>

        {/* Font */}
        <section>
          <SectionLabel>Font</SectionLabel>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {(
              Object.entries(FONT_FAMILIES) as [
                FontFamily,
                (typeof FONT_FAMILIES)[FontFamily],
              ][]
            ).map(([key, font]) => {
              const isActive = fontFamily === key;
              return (
                <OptionButton
                  key={key}
                  active={isActive}
                  onClick={() => handleFontChange(key)}
                >
                  {isActive && (
                    <IconCheck
                      size={14}
                      className="shrink-0 text-primary"
                      strokeWidth={2.5}
                    />
                  )}
                  <span style={{ fontFamily: font.stack }}>{font.label}</span>
                </OptionButton>
              );
            })}
          </div>
        </section>

        {/* Font Spacing */}
        <section>
          <SectionLabel>Font Spacing</SectionLabel>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {LETTER_SPACING_OPTIONS.map(({ value, label }) => (
              <OptionButton
                key={value}
                active={letterSpacing === value}
                onClick={() => handleLetterSpacingChange(value)}
              >
                <span
                  className="text-xs font-semibold"
                  style={{
                    letterSpacing: LETTER_SPACING_VALUES[value].value,
                  }}
                >
                  Aa
                </span>
                {label}
              </OptionButton>
            ))}
          </div>
        </section>

        {/* Preview */}
        <section>
          <SectionLabel>Preview</SectionLabel>
          <div className="rounded-xl border border-border/70 bg-card/80 p-3 shadow-sm sm:p-5">
            <div className="mb-4 flex items-start gap-2">
              <div
                className="mt-1 h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: ACCENT_COLORS[accentColor].preview }}
              />
              <p className="text-xs sm:text-sm font-semibold text-foreground">
                {ACCENT_COLORS[accentColor].label} &middot;{" "}
                {RADIUS_OPTIONS.find((r) => r.value === radius)?.label} radius
                &middot; {FONT_FAMILIES[fontFamily].label} &middot;{" "}
                {LETTER_SPACING_VALUES[letterSpacing].label} spacing &middot;{" "}
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
