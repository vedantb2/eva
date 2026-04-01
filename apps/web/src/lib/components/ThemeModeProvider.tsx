import { useEffect, useCallback } from "react";
import { useLocalStorage } from "usehooks-ts";
import { ThemeModeContext } from "@/lib/hooks/useThemeMode";
import type { ThemeMode } from "@/lib/hooks/useThemeMode";

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
}

function isValidTheme(value: string): value is ThemeMode {
  return value === "dark" || value === "light" || value === "system";
}

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const [storedTheme, setStoredTheme] = useLocalStorage("theme", "light");
  const theme: ThemeMode = isValidTheme(storedTheme) ? storedTheme : "light";
  const resolvedTheme = resolveTheme(theme);

  const setTheme = useCallback(
    (t: ThemeMode) => {
      setStoredTheme(t);
      applyTheme(resolveTheme(t));
    },
    [setStoredTheme],
  );

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
