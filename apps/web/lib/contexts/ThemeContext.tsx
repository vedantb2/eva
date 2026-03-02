"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useTheme } from "next-themes";
import { useQuery, useMutation } from "convex/react";
import { api } from "@conductor/backend";

export type AccentColor =
  | "teal"
  | "blue"
  | "purple"
  | "rose"
  | "orange"
  | "green";
export type RadiusSize = "none" | "sm" | "md" | "lg" | "xl";

export interface CustomTheme {
  accentColor?: AccentColor;
  radius?: RadiusSize;
}

interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
  toggleTheme: () => void;
  mounted: boolean;
  customTheme: CustomTheme;
  setCustomTheme: (customTheme: CustomTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const ACCENT_COLORS: Record<
  AccentColor,
  {
    label: string;
    preview: string;
    light: {
      primary: string;
      foreground: string;
      accent: string;
      accentFg: string;
    };
    dark: {
      primary: string;
      foreground: string;
      accent: string;
      accentFg: string;
    };
  }
> = {
  teal: {
    label: "Teal",
    preview: "#0D8478",
    light: {
      primary: "13 132 120",
      foreground: "255 255 255",
      accent: "224 240 236",
      accentFg: "10 90 81",
    },
    dark: {
      primary: "52 199 181",
      foreground: "8 23 20",
      accent: "34 47 44",
      accentFg: "214 233 228",
    },
  },
  blue: {
    label: "Blue",
    preview: "#2563EB",
    light: {
      primary: "37 99 235",
      foreground: "255 255 255",
      accent: "219 234 254",
      accentFg: "29 78 216",
    },
    dark: {
      primary: "96 165 250",
      foreground: "8 18 40",
      accent: "22 36 60",
      accentFg: "191 219 254",
    },
  },
  purple: {
    label: "Purple",
    preview: "#7C3AED",
    light: {
      primary: "124 58 237",
      foreground: "255 255 255",
      accent: "237 233 254",
      accentFg: "91 33 182",
    },
    dark: {
      primary: "167 139 250",
      foreground: "18 8 40",
      accent: "38 28 58",
      accentFg: "221 214 254",
    },
  },
  rose: {
    label: "Rose",
    preview: "#E11D48",
    light: {
      primary: "225 29 72",
      foreground: "255 255 255",
      accent: "255 228 230",
      accentFg: "159 18 57",
    },
    dark: {
      primary: "251 113 133",
      foreground: "40 8 18",
      accent: "58 20 30",
      accentFg: "253 164 175",
    },
  },
  orange: {
    label: "Orange",
    preview: "#EA580C",
    light: {
      primary: "234 88 12",
      foreground: "255 255 255",
      accent: "255 237 213",
      accentFg: "154 52 18",
    },
    dark: {
      primary: "251 146 60",
      foreground: "40 18 8",
      accent: "58 30 12",
      accentFg: "253 186 116",
    },
  },
  green: {
    label: "Green",
    preview: "#15803D",
    light: {
      primary: "21 128 61",
      foreground: "255 255 255",
      accent: "220 252 231",
      accentFg: "21 128 61",
    },
    dark: {
      primary: "74 222 128",
      foreground: "8 30 18",
      accent: "18 46 28",
      accentFg: "187 247 208",
    },
  },
};

const RADIUS_VALUES: Record<RadiusSize, string> = {
  none: "0rem",
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
};

function applyCustomThemeVars(customTheme: CustomTheme, isDark: boolean) {
  const accentColor = customTheme.accentColor ?? "teal";
  const radius = customTheme.radius ?? "md";

  // Apply radius
  document.documentElement.style.setProperty("--radius", RADIUS_VALUES[radius]);

  // If using default teal, remove any custom style element so defaults apply
  if (accentColor === "teal") {
    const el = document.getElementById("custom-theme-accent");
    if (el) el.remove();
    return;
  }

  const colors = ACCENT_COLORS[accentColor];
  const mode = isDark ? colors.dark : colors.light;

  let styleEl = document.getElementById(
    "custom-theme-accent",
  ) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "custom-theme-accent";
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = `
    :root {
      --primary: ${colors.light.primary};
      --primary-foreground: ${colors.light.foreground};
      --ring: ${colors.light.primary};
      --chart-1: ${colors.light.primary};
      --accent: ${colors.light.accent};
      --accent-foreground: ${colors.light.accentFg};
      --sidebar-primary: ${colors.light.primary};
      --sidebar-primary-foreground: ${colors.light.foreground};
      --sidebar-ring: ${colors.light.primary};
      --sidebar-accent-foreground: ${colors.light.accentFg};
    }
    .dark {
      --primary: ${colors.dark.primary};
      --primary-foreground: ${colors.dark.foreground};
      --ring: ${colors.dark.primary};
      --chart-1: ${colors.dark.primary};
      --accent: ${colors.dark.accent};
      --accent-foreground: ${colors.dark.accentFg};
      --sidebar-primary: ${colors.dark.primary};
      --sidebar-primary-foreground: ${colors.dark.foreground};
      --sidebar-ring: ${colors.dark.primary};
      --sidebar-accent-foreground: ${colors.dark.accentFg};
    }
  `;
}

export { ACCENT_COLORS, RADIUS_VALUES };

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme: setNextTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const syncedTheme = useQuery(api.auth.getTheme);
  const setThemeMutation = useMutation(api.auth.setTheme);
  const syncedCustomTheme = useQuery(api.auth.getCustomTheme);
  const setCustomThemeMutation = useMutation(api.auth.setCustomTheme);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (syncedTheme === undefined || syncedTheme === null) return;
    if (syncedTheme !== theme) {
      setNextTheme(syncedTheme);
    }
  }, [syncedTheme]);

  useEffect(() => {
    if (syncedCustomTheme === undefined) return;
    const customTheme = syncedCustomTheme ?? {};
    const isDark = theme === "dark";
    applyCustomThemeVars(customTheme, isDark);
  }, [syncedCustomTheme, theme]);

  const setTheme = useCallback(
    (next: string) => {
      setNextTheme(next);
      if (next === "light" || next === "dark") {
        setThemeMutation({ theme: next });
      }
    },
    [setNextTheme, setThemeMutation],
  );

  const toggleTheme = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
  }, [theme, setTheme]);

  const setCustomTheme = useCallback(
    (customTheme: CustomTheme) => {
      setCustomThemeMutation({ customTheme });
      const isDark = theme === "dark";
      applyCustomThemeVars(customTheme, isDark);
    },
    [setCustomThemeMutation, theme],
  );

  const customTheme: CustomTheme = syncedCustomTheme ?? {};

  return (
    <ThemeContext.Provider
      value={{
        theme: theme || "dark",
        setTheme,
        toggleTheme,
        mounted,
        customTheme,
        setCustomTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }
  return context;
}
