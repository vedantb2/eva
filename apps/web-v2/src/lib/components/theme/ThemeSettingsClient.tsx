"use client";

import { PageWrapper } from "@/lib/components/PageWrapper";
import {
  useThemeContext,
  resolveCustomTheme,
} from "@/lib/contexts/ThemeContext";
import type {
  AccentColor,
  CustomTheme,
  RadiusSize,
  FontFamily,
  LetterSpacing,
} from "@/lib/contexts/ThemeContext";
import { Spinner } from "@conductor/ui";
import { useThemeMode } from "@/lib/hooks/useThemeMode";
import { AppearanceSection } from "./_components/AppearanceSection";
import { PresetsSection } from "./_components/PresetsSection";
import { AccentColorSection } from "./_components/AccentColorSection";
import { TypographySection } from "./_components/TypographySection";
import { ThemePreview } from "./_components/ThemePreview";

export function ThemeSettingsClient() {
  const { theme, setTheme, customTheme, setCustomTheme, mounted } =
    useThemeContext();
  const { setTheme: setNextTheme } = useThemeMode();

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

  const handleApplyPreset = (preset: Required<CustomTheme>) => {
    setCustomTheme(preset);
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
        <AppearanceSection
          currentMode={currentMode}
          onModeChange={handleModeChange}
        />
        <PresetsSection
          currentTheme={resolved}
          onApplyPreset={handleApplyPreset}
        />
        <AccentColorSection
          accentColor={accentColor}
          onAccentChange={handleAccentChange}
        />
        <TypographySection
          fontFamily={fontFamily}
          onFontChange={handleFontChange}
          letterSpacing={letterSpacing}
          onLetterSpacingChange={handleLetterSpacingChange}
          radius={radius}
          onRadiusChange={handleRadiusChange}
        />
        <ThemePreview
          accentColor={accentColor}
          radius={radius}
          fontFamily={fontFamily}
          letterSpacing={letterSpacing}
          currentMode={currentMode}
        />
      </div>
    </PageWrapper>
  );
}
