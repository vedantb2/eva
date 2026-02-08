"use client";

import { useEffect, useState } from "react";

export type ColorScheme = "light" | "dark";

export function useColorScheme(): {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
} {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>("light");

  useEffect(() => {
    // Check for saved theme preference or default to system preference
    const savedTheme = localStorage.getItem("color-scheme") as ColorScheme;
    if (savedTheme) {
      setColorSchemeState(savedTheme);
    } else {
      // Check system preference
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      setColorSchemeState(mediaQuery.matches ? "dark" : "light");

      // Listen for system theme changes
      const handleChange = (e: MediaQueryListEvent) => {
        if (!localStorage.getItem("color-scheme")) {
          setColorSchemeState(e.matches ? "dark" : "light");
        }
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, []);

  const setColorScheme = (scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    localStorage.setItem("color-scheme", scheme);

    // Update document class for Tailwind CSS
    if (scheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Apply the current theme to document
  useEffect(() => {
    if (colorScheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [colorScheme]);

  return { colorScheme, setColorScheme };
}
