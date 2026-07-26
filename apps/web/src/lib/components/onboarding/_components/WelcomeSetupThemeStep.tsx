import { AppearanceSection } from "@/lib/components/theme/_components/AppearanceSection";
import { AccentColorSection } from "@/lib/components/theme/_components/AccentColorSection";
import { SectionLabel } from "@/lib/components/theme/_components/SectionLabel";
import type { AccentColor } from "@/lib/contexts/ThemeContext";

interface WelcomeSetupThemeStepProps {
  currentMode: "light" | "dark" | "system";
  accentColor: AccentColor;
  onModeChange: (mode: "light" | "dark" | "system") => void;
  onAccentChange: (color: AccentColor) => void;
}

export function WelcomeSetupThemeStep({
  currentMode,
  accentColor,
  onModeChange,
  onAccentChange,
}: WelcomeSetupThemeStepProps) {
  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        Choose how Eva looks — mode and accent color.
      </p>
      <section>
        <SectionLabel>Appearance</SectionLabel>
        <AppearanceSection
          compact
          currentMode={currentMode}
          onModeChange={onModeChange}
        />
      </section>
      <section>
        <SectionLabel>Accent Color</SectionLabel>
        <AccentColorSection
          accentColor={accentColor}
          onAccentChange={onAccentChange}
        />
      </section>
    </div>
  );
}
