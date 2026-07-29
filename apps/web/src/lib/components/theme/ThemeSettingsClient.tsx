"use client";

import { PageWrapper } from "@/lib/components/PageWrapper";
import { SettingsSection } from "@/lib/components/settings/SettingsSection";
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
import { Spinner } from "@eva/ui";
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
      <PageWrapper title="Theme" comfortable>
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Theme" comfortable>
      <div className="space-y-4">
        <SettingsSection
          title="Appearance"
          description="Use light, use dark, or follow your system setting."
          // Capped so the three mode tiles stay a readable size on wide screens.
          bodyClassName="max-w-2xl"
        >
          <AppearanceSection
            currentMode={currentMode}
            onModeChange={handleModeChange}
          />
        </SettingsSection>

        <SettingsSection
          title="Presets"
          description="Apply a ready-made combination of accent, font, radius, and spacing. Any change below moves you off the preset."
          bodyClassName="max-w-2xl"
        >
          <PresetsSection
            currentTheme={resolved}
            onApplyPreset={handleApplyPreset}
          />
        </SettingsSection>

        <SettingsSection
          title="Accent Color"
          description="Drives buttons, links, focus rings, and charts. Zinc keeps the interface monochrome."
        >
          <AccentColorSection
            accentColor={accentColor}
            onAccentChange={handleAccentChange}
          />
        </SettingsSection>

        <SettingsSection
          title="Type & Shape"
          description="Corner radius, typeface, and letter spacing, applied across the whole interface."
        >
          <TypographySection
            fontFamily={fontFamily}
            onFontChange={handleFontChange}
            letterSpacing={letterSpacing}
            onLetterSpacingChange={handleLetterSpacingChange}
            radius={radius}
            onRadiusChange={handleRadiusChange}
          />
        </SettingsSection>

        <SettingsSection
          title="Preview"
          description="Your current selection, shown on the common controls."
        >
          <ThemePreview
            accentColor={accentColor}
            radius={radius}
            fontFamily={fontFamily}
            letterSpacing={letterSpacing}
            currentMode={currentMode}
          />
        </SettingsSection>
      </div>
    </PageWrapper>
  );
}
