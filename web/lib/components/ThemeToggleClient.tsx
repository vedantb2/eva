"use client";

import { IconMoon, IconSun } from "@tabler/icons-react";
import { useThemeContext } from "@/lib/contexts/ThemeContext";

export function ThemeToggleClient() {
  const { theme, toggleTheme, mounted } = useThemeContext();

  // Prevent rendering until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <button
        className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800"
        aria-label="Toggle theme"
        disabled
      >
        <div className="w-5 h-5" />
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      type="button"
    >
      {isDark ? (
        <IconSun className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
      ) : (
        <IconMoon className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
      )}
    </button>
  );
}
