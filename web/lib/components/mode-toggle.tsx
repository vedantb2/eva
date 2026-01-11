"use client";

import { IconMoon, IconSun } from "@tabler/icons-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-xl p-2 app-card-interactive flex items-center justify-center">
        <div className="h-5 w-5" />
      </div>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="w-10 h-10 rounded-xl p-2 app-card-interactive hover:shadow-md transition-all duration-200 flex items-center justify-center group"
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      <div className="relative w-5 h-5">
        {theme === "light" ? (
          <IconMoon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
        ) : (
          <IconSun className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
        )}
      </div>
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}