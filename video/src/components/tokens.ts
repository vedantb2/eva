// Brand palette — matches the app's dark theme (apps/web --background: 5 6 6,
// --card: 23 24 26) and the eva mark gradient (apps/web/public/icon.svg).
export const COLORS = {
  background: "#050606",
  backgroundRaised: "#0b0c0f",
  card: "#141518",
  cardRaised: "#1b1c20",
  muted: "#222324",
  // on-screen UI accent (indigo) used by the app's agent theme
  accent: "#818cf8",
  accentBright: "#a5b4fc",
  accentDeep: "#1e1b4b",
  // eva brand mark colours
  brandPurple: "#8B3FB8",
  brandBlue: "#3B7DD8",
  border: "#2a2b2e",
  borderSoft: "rgba(255,255,255,0.07)",
  foreground: "#fbfcfd",
  foregroundMuted: "#9ca3af",
  foregroundFaint: "#6b7280",
  success: "#34d399",
} as const;

// Brand gradient (purple -> indigo -> blue), used for the mark, glows and emphasis.
export const BRAND_GRADIENT = `linear-gradient(135deg, ${COLORS.brandPurple} 0%, ${COLORS.accent} 52%, ${COLORS.brandBlue} 100%)`;
export const BRAND_GRADIENT_TEXT = `linear-gradient(100deg, #c4b5fd 0%, #a5b4fc 45%, #7dd3fc 100%)`;

export const FONT = "Inter, sans-serif";
export const FONT_MONO = "'JetBrains Mono', ui-monospace, monospace";
export const RADIUS = 12;
export const PADDING = 48; // canvas padding when framing screenshots (720p legacy)
