import { useEffect, useState } from "react";
import {
  ThemeModeContext,
  appearanceToResolvedTheme,
  type ThemeAppearance,
  type ThemeMode,
} from "@/lib/hooks/useThemeMode";
import {
  CUSTOM_THEME_HINT_KEY,
  writeThemeAppearanceHint,
} from "@/lib/contexts/themeHint";

function getSystemAppearance(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveAppearance(theme: ThemeMode): ThemeAppearance {
  return theme === "system" ? getSystemAppearance() : theme;
}

/**
 * Apply DOM classes for the resolved appearance.
 * Neutral is dark-family: `class="dark neutral"` so Tailwind `dark:` keeps working
 * while `.dark.neutral` surface tokens lift the near-black Dark palette.
 */
function applyAppearance(appearance: ThemeAppearance) {
  const root = document.documentElement;
  root.classList.toggle(
    "dark",
    appearance === "dark" || appearance === "neutral",
  );
  root.classList.toggle("neutral", appearance === "neutral");
  writeThemeAppearanceHint(appearance);
}

function isValidTheme(value: string): value is ThemeMode {
  return (
    value === "dark" ||
    value === "light" ||
    value === "neutral" ||
    value === "system"
  );
}

function isAppearance(value: string): value is ThemeAppearance {
  return value === "light" || value === "neutral" || value === "dark";
}

/**
 * Seed in-memory theme from the FOUC hint (or legacy `theme` key) so the first
 * client render matches index.html. Convex remains source of truth via
 * ThemeProvider — we no longer persist preference to localStorage `"theme"`.
 */
function readInitialTheme(): ThemeMode {
  try {
    const raw = localStorage.getItem(CUSTOM_THEME_HINT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        !Array.isArray(parsed)
      ) {
        const appearance = Reflect.get(parsed, "appearance");
        if (typeof appearance === "string" && isAppearance(appearance)) {
          return appearance;
        }
      }
    }
  } catch {
    // Ignore parse / private-mode failures.
  }
  try {
    const legacy = localStorage.getItem("theme");
    if (legacy && isValidTheme(legacy)) return legacy;
  } catch {
    // Ignore.
  }
  return "light";
}

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(readInitialTheme);
  const appearance = resolveAppearance(theme);
  const resolvedTheme = appearanceToResolvedTheme(appearance);

  const setTheme = (t: ThemeMode) => {
    setThemeState(t);
    applyAppearance(resolveAppearance(t));
  };

  useEffect(() => {
    applyAppearance(appearance);
  }, [appearance]);

  useEffect(() => {
    if (theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      applyAppearance(getSystemAppearance());
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [theme]);

  return (
    <ThemeModeContext.Provider
      value={{ theme, appearance, resolvedTheme, setTheme }}
    >
      {children}
    </ThemeModeContext.Provider>
  );
}
