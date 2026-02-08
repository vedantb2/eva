"use client";

import { IconMoon, IconSun } from "@tabler/icons-react";
import { useThemeContext } from "@/lib/contexts/ThemeContext";
import { Button } from "@conductor/ui";

export function ThemeToggleClient() {
  const { theme, toggleTheme, mounted } = useThemeContext();

  // Prevent rendering until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <button
        className="p-2 rounded-lg bg-secondary"
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
        <IconSun className="size-5 text-muted-foreground" />
      ) : (
        <IconMoon className="size-5 text-muted-foreground" />
      )}
    </Button>
  );
}
