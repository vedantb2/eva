"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useThemeMode } from "@/lib/hooks/useThemeMode";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";

export type AccentColor =
  | "teal"
  | "blue"
  | "purple"
  | "rose"
  | "orange"
  | "green"
  | "amber"
  | "cyan"
  | "pink"
  | "indigo"
  | "red";
export type RadiusSize = "none" | "sm" | "md" | "lg" | "xl" | "full";
export type FontFamily =
  | "inter"
  | "roboto"
  | "poppins"
  | "dm-sans"
  | "space-grotesk"
  | "geist"
  | "source-serif"
  | "jakarta"
  | "outfit"
  | "nunito"
  | "ibm-plex"
  | "figtree";
export type LetterSpacing = "tighter" | "tight" | "normal" | "wide" | "wider";

export interface CustomTheme {
  accentColor?: AccentColor;
  radius?: RadiusSize;
  fontFamily?: FontFamily;
  letterSpacing?: LetterSpacing;
}

export interface ResolvedCustomTheme {
  accentColor: AccentColor;
  radius: RadiusSize;
  fontFamily: FontFamily;
  letterSpacing: LetterSpacing;
}

const CUSTOM_THEME_DEFAULTS: ResolvedCustomTheme = {
  accentColor: "teal",
  radius: "md",
  fontFamily: "inter",
  letterSpacing: "normal",
};

export function resolveCustomTheme(custom: CustomTheme): ResolvedCustomTheme {
  return {
    accentColor: custom.accentColor ?? CUSTOM_THEME_DEFAULTS.accentColor,
    radius: custom.radius ?? CUSTOM_THEME_DEFAULTS.radius,
    fontFamily: custom.fontFamily ?? CUSTOM_THEME_DEFAULTS.fontFamily,
    letterSpacing: custom.letterSpacing ?? CUSTOM_THEME_DEFAULTS.letterSpacing,
  };
}

interface ThemeContextType {
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
  toggleTheme: () => void;
  mounted: boolean;
  customTheme: CustomTheme;
  setCustomTheme: (customTheme: CustomTheme) => void;
}

export const FONT_FAMILIES: Record<
  FontFamily,
  { label: string; variable: string; stack: string }
> = {
  inter: {
    label: "Inter",
    variable: "--font-inter",
    stack: "Inter, ui-sans-serif, system-ui, sans-serif",
  },
  roboto: {
    label: "Roboto",
    variable: "--font-roboto",
    stack: "Roboto, ui-sans-serif, system-ui, sans-serif",
  },
  poppins: {
    label: "Poppins",
    variable: "--font-poppins",
    stack: "Poppins, ui-sans-serif, system-ui, sans-serif",
  },
  "dm-sans": {
    label: "DM Sans",
    variable: "--font-dm-sans",
    stack: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
  },
  "space-grotesk": {
    label: "Space Grotesk",
    variable: "--font-space-grotesk",
    stack: "'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
  },
  geist: {
    label: "Geist",
    variable: "--font-geist-sans",
    stack: "'Geist Sans', ui-sans-serif, system-ui, sans-serif",
  },
  "source-serif": {
    label: "Source Serif",
    variable: "--font-source-serif",
    stack: "'Source Serif 4', Georgia, 'Times New Roman', serif",
  },
  jakarta: {
    label: "Jakarta Sans",
    variable: "--font-jakarta",
    stack: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif",
  },
  outfit: {
    label: "Outfit",
    variable: "--font-outfit",
    stack: "Outfit, ui-sans-serif, system-ui, sans-serif",
  },
  nunito: {
    label: "Nunito",
    variable: "--font-nunito",
    stack: "Nunito, ui-sans-serif, system-ui, sans-serif",
  },
  "ibm-plex": {
    label: "IBM Plex Sans",
    variable: "--font-ibm-plex",
    stack: "'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif",
  },
  figtree: {
    label: "Figtree",
    variable: "--font-figtree",
    stack: "Figtree, ui-sans-serif, system-ui, sans-serif",
  },
};

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
  amber: {
    label: "Amber",
    preview: "#D97706",
    light: {
      primary: "217 119 6",
      foreground: "255 255 255",
      accent: "254 243 199",
      accentFg: "146 64 14",
    },
    dark: {
      primary: "251 191 36",
      foreground: "26 19 4",
      accent: "55 37 10",
      accentFg: "253 230 138",
    },
  },
  cyan: {
    label: "Cyan",
    preview: "#0891B2",
    light: {
      primary: "8 145 178",
      foreground: "255 255 255",
      accent: "207 250 254",
      accentFg: "22 78 99",
    },
    dark: {
      primary: "34 211 238",
      foreground: "4 26 34",
      accent: "12 54 70",
      accentFg: "165 243 252",
    },
  },
  pink: {
    label: "Pink",
    preview: "#DB2777",
    light: {
      primary: "219 39 119",
      foreground: "255 255 255",
      accent: "252 231 243",
      accentFg: "157 23 77",
    },
    dark: {
      primary: "244 114 182",
      foreground: "40 8 22",
      accent: "62 20 42",
      accentFg: "251 207 232",
    },
  },
  indigo: {
    label: "Indigo",
    preview: "#4F46E5",
    light: {
      primary: "79 70 229",
      foreground: "255 255 255",
      accent: "224 231 255",
      accentFg: "55 48 163",
    },
    dark: {
      primary: "129 140 248",
      foreground: "12 10 40",
      accent: "30 27 75",
      accentFg: "199 210 254",
    },
  },
  red: {
    label: "Red",
    preview: "#DC2626",
    light: {
      primary: "220 38 38",
      foreground: "255 255 255",
      accent: "254 226 226",
      accentFg: "153 27 27",
    },
    dark: {
      primary: "248 113 113",
      foreground: "40 8 8",
      accent: "58 20 20",
      accentFg: "254 202 202",
    },
  },
};

const RADIUS_VALUES: Record<RadiusSize, string> = {
  none: "0rem",
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  full: "9999px",
};

export const LETTER_SPACING_VALUES: Record<
  LetterSpacing,
  { label: string; value: string }
> = {
  tighter: { label: "Tighter", value: "-0.04em" },
  tight: { label: "Tight", value: "-0.02em" },
  normal: { label: "Normal", value: "-0.012em" },
  wide: { label: "Wide", value: "0.01em" },
  wider: { label: "Wider", value: "0.03em" },
};

function applyCustomThemeVars(customTheme: CustomTheme, isDark: boolean) {
  const accentColor = customTheme.accentColor ?? "teal";
  const radius = customTheme.radius ?? "md";
  const fontFamily = customTheme.fontFamily ?? "inter";
  const letterSpacing = customTheme.letterSpacing ?? "normal";

  document.documentElement.style.setProperty("--radius", RADIUS_VALUES[radius]);

  document.documentElement.style.setProperty(
    "--font-sans",
    FONT_FAMILIES[fontFamily].stack,
  );

  document.documentElement.style.setProperty(
    "--tracking-normal",
    LETTER_SPACING_VALUES[letterSpacing].value,
  );

  // If using default teal, remove any custom style element so defaults apply
  if (accentColor === "teal") {
    const el = document.getElementById("custom-theme-accent");
    if (el) el.remove();
    return;
  }

  const colors = ACCENT_COLORS[accentColor];
  const mode = isDark ? colors.dark : colors.light;

  const existing = document.getElementById("custom-theme-accent");
  let styleEl: HTMLStyleElement;
  if (existing instanceof HTMLStyleElement) {
    styleEl = existing;
  } else {
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
  const { theme, setTheme: setNextTheme } = useThemeMode();
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
    (next: "light" | "dark" | "system") => {
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
