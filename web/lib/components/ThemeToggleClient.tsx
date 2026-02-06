"use client";

import { IconMoon, IconSun } from "@tabler/icons-react";
import { useThemeContext } from "@/lib/contexts/ThemeContext";
import { Button } from "@/lib/components/ui/button";

export function ThemeToggleClient() {
  const { theme, toggleTheme, mounted } = useThemeContext();

  // Prevent rendering until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <button
        className="p-2 rounded-lg bg-white dark:bg-neutral-800"
        aria-label="Toggle theme"
        disabled
      >
        <div className="size-5" />
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme}>
      {isDark ? (
        <IconSun className="size-5 text-neutral-600 dark:text-neutral-300" />
      ) : (
        <IconMoon className="size-5 text-neutral-600 dark:text-neutral-300" />
      )}
    </Button>
  );
}
