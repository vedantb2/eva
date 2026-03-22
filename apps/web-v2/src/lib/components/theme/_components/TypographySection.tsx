"use client";

import {
  FONT_FAMILIES,
  LETTER_SPACING_VALUES,
} from "@/lib/contexts/ThemeContext";
import type {
  RadiusSize,
  FontFamily,
  LetterSpacing,
} from "@/lib/contexts/ThemeContext";
import { IconCheck } from "@tabler/icons-react";
import { SectionLabel } from "./SectionLabel";
import { OptionButton } from "./OptionButton";

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

export { RADIUS_OPTIONS };

export function TypographySection({
  fontFamily,
  onFontChange,
  letterSpacing,
  onLetterSpacingChange,
  radius,
  onRadiusChange,
}: {
  fontFamily: FontFamily;
  onFontChange: (f: FontFamily) => void;
  letterSpacing: LetterSpacing;
  onLetterSpacingChange: (ls: LetterSpacing) => void;
  radius: RadiusSize;
  onRadiusChange: (r: RadiusSize) => void;
}) {
  return (
    <>
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
                onClick={() => onRadiusChange(value)}
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
                onClick={() => onFontChange(key)}
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

      <section>
        <SectionLabel>Font Spacing</SectionLabel>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {LETTER_SPACING_OPTIONS.map(({ value, label }) => (
            <OptionButton
              key={value}
              active={letterSpacing === value}
              onClick={() => onLetterSpacingChange(value)}
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
    </>
  );
}
