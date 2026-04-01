import { useState, useEffect, useCallback } from "react";
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

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light" || stored === "system")
      return stored;
    return "light";
  });
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() =>
    resolveTheme(theme),
  );

  const setTheme = useCallback((t: ThemeMode) => {
    setThemeState(t);
    localStorage.setItem("theme", t);
    const resolved = resolveTheme(t);
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, []);

  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    if (theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const resolved = getSystemTheme();
      setResolvedTheme(resolved);
      applyTheme(resolved);
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
