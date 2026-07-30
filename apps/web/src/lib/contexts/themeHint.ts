/** localStorage key for early-paint theme hint (read by index.html). */
export const CUSTOM_THEME_HINT_KEY = "eva-custom-theme-hint";

type ThemeHint = {
  accentColor?: string;
  radius?: string;
  fontFamily?: string;
  letterSpacing?: string;
  /** Resolved appearance for FOUC. Convex owns the real preference. */
  appearance?: "light" | "neutral" | "dark";
};

function getStringProp(value: object, key: string): string | undefined {
  if (!(key in value)) return undefined;
  const prop = Reflect.get(value, key);
  return typeof prop === "string" ? prop : undefined;
}

function isAppearance(
  value: string | undefined,
): value is "light" | "neutral" | "dark" {
  return value === "light" || value === "neutral" || value === "dark";
}

function readThemeHint(): ThemeHint {
  try {
    const raw = localStorage.getItem(CUSTOM_THEME_HINT_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return {};
    }
    const appearance = getStringProp(parsed, "appearance");
    return {
      accentColor: getStringProp(parsed, "accentColor"),
      radius: getStringProp(parsed, "radius"),
      fontFamily: getStringProp(parsed, "fontFamily"),
      letterSpacing: getStringProp(parsed, "letterSpacing"),
      ...(isAppearance(appearance) ? { appearance } : {}),
    };
  } catch {
    return {};
  }
}

function writeThemeHint(patch: ThemeHint) {
  try {
    localStorage.setItem(
      CUSTOM_THEME_HINT_KEY,
      JSON.stringify({ ...readThemeHint(), ...patch }),
    );
  } catch {
    // Ignore quota / private mode failures — live query still wins.
  }
}

/** Merge resolved appearance into the FOUC hint (no `"theme"` localStorage). */
export function writeThemeAppearanceHint(
  appearance: "light" | "neutral" | "dark",
) {
  writeThemeHint({ appearance });
}

/** Merge custom-theme fields into the FOUC hint. */
export function writeCustomThemeHint(fields: {
  accentColor: string;
  radius: string;
  fontFamily: string;
  letterSpacing: string;
}) {
  writeThemeHint(fields);
}
