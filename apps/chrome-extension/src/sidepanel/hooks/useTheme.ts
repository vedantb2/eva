import { useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@conductor/backend";

type AccentColor =
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

type RadiusSize = "none" | "sm" | "md" | "lg" | "xl";

type FontFamily =
  | "inter"
  | "roboto"
  | "poppins"
  | "dm-sans"
  | "space-grotesk"
  | "geist";

type LetterSpacing = "tighter" | "tight" | "normal" | "wide" | "wider";

interface CustomTheme {
  accentColor?: AccentColor;
  radius?: RadiusSize;
  fontFamily?: FontFamily;
  letterSpacing?: LetterSpacing;
}

const FONT_FAMILIES: Record<FontFamily, string> = {
  inter: "var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif",
  roboto: "var(--font-roboto), Roboto, ui-sans-serif, system-ui, sans-serif",
  poppins: "var(--font-poppins), Poppins, ui-sans-serif, system-ui, sans-serif",
  "dm-sans":
    "var(--font-dm-sans), 'DM Sans', ui-sans-serif, system-ui, sans-serif",
  "space-grotesk":
    "var(--font-space-grotesk), 'Space Grotesk', ui-sans-serif, system-ui, sans-serif",
  geist:
    "var(--font-geist-sans), 'Geist Sans', ui-sans-serif, system-ui, sans-serif",
};

const RADIUS_VALUES: Record<RadiusSize, string> = {
  none: "0rem",
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
};

const LETTER_SPACING_VALUES: Record<LetterSpacing, string> = {
  tighter: "-0.04em",
  tight: "-0.02em",
  normal: "-0.012em",
  wide: "0.01em",
  wider: "0.03em",
};

const ACCENT_COLORS: Record<
  AccentColor,
  {
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

function applyCustomThemeVars(customTheme: CustomTheme) {
  const accentColor = customTheme.accentColor ?? "teal";
  const radius = customTheme.radius ?? "md";
  const fontFamily = customTheme.fontFamily ?? "inter";
  const letterSpacing = customTheme.letterSpacing ?? "normal";

  document.documentElement.style.setProperty("--radius", RADIUS_VALUES[radius]);
  document.documentElement.style.setProperty(
    "--font-sans",
    FONT_FAMILIES[fontFamily],
  );
  document.documentElement.style.setProperty(
    "--tracking-normal",
    LETTER_SPACING_VALUES[letterSpacing],
  );

  if (accentColor === "teal") {
    const el = document.getElementById("custom-theme-accent");
    if (el) el.remove();
    return;
  }

  const colors = ACCENT_COLORS[accentColor];
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

export function useTheme() {
  const syncedTheme = useQuery(api.auth.getTheme);
  const setThemeMutation = useMutation(api.auth.setTheme);
  const syncedCustomTheme = useQuery(api.auth.getCustomTheme);
  const theme = syncedTheme ?? "dark";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    if (syncedCustomTheme === undefined) return;
    const customTheme: CustomTheme = syncedCustomTheme ?? {};
    applyCustomThemeVars(customTheme);
  }, [syncedCustomTheme, theme]);

  const toggleTheme = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    setThemeMutation({ theme: next });
  }, [theme, setThemeMutation]);

  return { theme, toggleTheme };
}
