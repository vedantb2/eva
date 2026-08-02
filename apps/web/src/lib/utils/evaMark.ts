import type { ThemeAppearance } from "@/lib/hooks/useThemeMode";

/**
 * Eva's mark: a filled circle with a two-tone star across its middle.
 *
 * Single source of truth for the geometry. `EvaIcon` and `LogoMark` render it
 * as JSX; `evaMarkDataUri` serialises it for the favicon. The two static files
 * in public/ (`icon.svg`, `favicon.svg`) mirror these numbers by hand — edit
 * them alongside anything here.
 */
export const EVA_MARK_TOP_POINTS = "0,256 217,237 256,64 295,237 512,256";
export const EVA_MARK_BOTTOM_POINTS = "0,256 217,275 256,449 295,275 512,256";
export const EVA_MARK_PURPLE = "#8B3FB8";
export const EVA_MARK_BLUE = "#3B7DD8";

/**
 * The mark's disc colour per theme, mirroring `--card` in globals.css
 * (`:root`, `.dark`, `.dark.neutral`). Hardcoded rather than read back off
 * `documentElement` because `ThemeModeProvider` is an ancestor: its
 * class-applying effect runs after its children's, so a child reading computed
 * styles would see the previous appearance.
 *
 * In-app only (`EvaIcon`). The tab favicon uses `FAVICON_SURFACE` instead —
 * card-dark `#17181A` disappears into dark browser chrome.
 */
export const MARK_SURFACE: Record<ThemeAppearance, string> = {
  light: "#FFFFFF",
  dark: "#17181A",
  neutral: "#303134",
};

/**
 * Favicon disc colours. Must read against OS tab chrome, not the app shell.
 * Discord keeps one bright mark; we do the same — light tile in every theme
 * so the disc silhouette never vanishes on a dark tab bar.
 */
const FAVICON_SURFACE: Record<ThemeAppearance, string> = {
  light: "#FFFFFF",
  dark: "#FFFFFF",
  neutral: "#FFFFFF",
};

/** Browser/OS chrome colour per theme, mirroring `--app-shell` in globals.css. */
export const SHELL_COLOR: Record<ThemeAppearance, string> = {
  light: "#F4F5F6",
  dark: "#050606",
  neutral: "#222325",
};

/**
 * Favicon layout, in the 512 viewBox.
 *
 * Rounded-full disc (same as in-app). The unread bubble sits on top of the
 * bottom-right edge — Discord-style overlay, not a carved inset. A thin dark
 * cutout separates red from the mark; the thick white ring is gone so the
 * digit can fill the badge. Star is scaled up so the thin sparkle still has
 * brand mass at 16px. Layout is identical with or without a count so the tab
 * icon does not resize as notifications arrive and clear.
 */
/** Grow the sparkle so its arms fill the disc the way Clyde fills Discord. */
const FAVICON_STAR_SCALE = 1.45;
/** Badge centre on the disc's BR quadrant — hangs slightly off the edge. */
const BADGE_CENTER = 390;
/** Thin dark separator only; red gets almost the whole bubble. */
const BADGE_CUTOUT_RADIUS = 168;
const BADGE_RADIUS = 156;

/** Shrinks the text as digits are added so "99+" still fits inside the bubble. */
function badgeFontSize(label: string): number {
  if (label.length >= 3) return 130;
  if (label.length === 2) return 210;
  return 300;
}

/** Full-bleed circle + enlarged star. */
function markGroup(surface: string): string {
  return (
    `<circle cx="256" cy="256" r="256" fill="${surface}"/>` +
    `<g transform="translate(256 256) scale(${FAVICON_STAR_SCALE}) translate(-256 -256)">` +
    `<polygon points="${EVA_MARK_TOP_POINTS}" fill="${EVA_MARK_PURPLE}"/>` +
    `<polygon points="${EVA_MARK_BOTTOM_POINTS}" fill="${EVA_MARK_BLUE}"/>` +
    `</g>`
  );
}

/** Unread bubble overlaid on the disc's bottom-right edge. */
function badgeGroup(label: string): string {
  return (
    `<circle cx="${BADGE_CENTER}" cy="${BADGE_CENTER}" r="${BADGE_CUTOUT_RADIUS}" fill="#050606"/>` +
    `<circle cx="${BADGE_CENTER}" cy="${BADGE_CENTER}" r="${BADGE_RADIUS}" fill="#e5484d"/>` +
    `<text x="${BADGE_CENTER}" y="${BADGE_CENTER}" text-anchor="middle" dominant-baseline="central" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="${badgeFontSize(label)}" fill="#ffffff">${label}</text>`
  );
}

/** `countUnread` saturates at 100, so anything above 99 is reported as "99+". */
export function formatBadgeLabel(count: number): string {
  return count > 99 ? "99+" : String(count);
}

/**
 * Eva's mark in the active theme's surface colour, optionally carrying an
 * unread count, as a data URI ready for a `<link rel="icon">` href.
 */
export function evaMarkDataUri(
  appearance: ThemeAppearance,
  badgeLabel: string | null,
): string {
  const surface = FAVICON_SURFACE[appearance];
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">' +
    markGroup(surface) +
    (badgeLabel === null ? "" : badgeGroup(badgeLabel)) +
    "</svg>";
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
