"use client";

import { IconMoon, IconSun } from "@tabler/icons-react";
import { useThemeContext } from "@/lib/contexts/ThemeContext";
import { Button } from "@conductor/ui";
import { CrossfadeIcon } from "@/lib/components/ui/CrossfadeIcon";

export function ThemeToggleClient() {
  const { theme, toggleTheme, mounted } = useThemeContext();

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label="Toggle theme" disabled>
        <div className="size-5" />
      </Button>
    );
  }

  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      <CrossfadeIcon
        show={isDark}
        trueKey="sun"
        falseKey="moon"
        whenTrue={<IconSun className="size-5 text-muted-foreground" />}
        whenFalse={<IconMoon className="size-5 text-muted-foreground" />}
      />
    </Button>
  );
}
