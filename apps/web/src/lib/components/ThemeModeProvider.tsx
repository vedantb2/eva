import { useEffect, useState } from "react";
import { ThemeModeContext } from "@/lib/hooks/useThemeMode";
import type { ThemeMode } from "@/lib/hooks/useThemeMode";
import {
  CUSTOM_THEME_HINT_KEY,
  writeThemeAppearanceHint,
} from "@/lib/contexts/themeHint";

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveTheme(theme: ThemeMode): "light" | "dark" {
  return theme === "system" ? getSystemTheme() : theme;
}

function applyTheme(resolved: "light" | "dark") {
  document.documentElement.classList.toggle("dark", resolved === "dark");
  writeThemeAppearanceHint(resolved);
}

function isValidTheme(value: string): value is ThemeMode {
  return value === "dark" || value === "light" || value === "system";
}

/**
 * Seed in-memory theme from the FOUC hint (or legacy `theme` key) so the first
 * client render matches index.html. Convex remains source of truth via
 * ThemeProvider — we no longer persist light/dark to localStorage `"theme"`.
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
        if (appearance === "light" || appearance === "dark") {
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
  const resolvedTheme = resolveTheme(theme);

  const setTheme = (t: ThemeMode) => {
    setThemeState(t);
    applyTheme(resolveTheme(t));
  };

  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    if (theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      applyTheme(getSystemTheme());
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [theme]);

  return (
    <ThemeModeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeModeContext.Provider>
  );
}
