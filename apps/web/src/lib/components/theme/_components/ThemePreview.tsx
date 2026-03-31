import {
  ACCENT_COLORS,
  FONT_FAMILIES,
  LETTER_SPACING_VALUES,
} from "@/lib/contexts/ThemeContext";
import type {
  AccentColor,
  RadiusSize,
  FontFamily,
  LetterSpacing,
} from "@/lib/contexts/ThemeContext";
import { SectionLabel } from "./SectionLabel";
import { RADIUS_OPTIONS } from "./TypographySection";

export function ThemePreview({
  accentColor,
  radius,
  fontFamily,
  letterSpacing,
  currentMode,
}: {
  accentColor: AccentColor;
  radius: RadiusSize;
  fontFamily: FontFamily;
  letterSpacing: LetterSpacing;
  currentMode: "light" | "dark" | "system";
}) {
  const radiusLabel =
    RADIUS_OPTIONS.find((r) => r.value === radius)?.label ?? radius;

  return (
    <section>
      <SectionLabel>Preview</SectionLabel>
      <div className="rounded-xl bg-muted/40 p-3 sm:p-5">
        <div className="mb-4 flex items-start gap-2">
          <div
            className="mt-1 h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: ACCENT_COLORS[accentColor].preview }}
          />
          <p className="text-xs sm:text-sm font-semibold text-foreground">
            {ACCENT_COLORS[accentColor].label} &middot; {radiusLabel} radius
            &middot; {FONT_FAMILIES[fontFamily].label} &middot;{" "}
            {LETTER_SPACING_VALUES[letterSpacing].label} spacing &middot;{" "}
            {currentMode.charAt(0).toUpperCase() + currentMode.slice(1)} mode
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
  );
}
