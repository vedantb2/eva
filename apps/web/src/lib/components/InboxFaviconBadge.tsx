import { useEffect } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";

/** The static icon shipped in public/, restored whenever the inbox is clear. */
const PLAIN_ICON_HREF = "/icon.svg";

/**
 * Eva's mark, kept in sync with public/icon.svg by hand. Inlined rather than
 * fetched so a new count can be drawn without waiting on a network round trip.
 */
const MARK =
  '<rect width="512" height="512" rx="108" ry="108" fill="#ffffff"/>' +
  '<polygon points="0,256 217,237 256,64 295,237 512,256" fill="#8B3FB8"/>' +
  '<polygon points="0,256 217,275 256,449 295,275 512,256" fill="#3B7DD8"/>';

/**
 * Badge geometry, in the mark's 512 viewBox units.
 *
 * Discord-style: large and overlapping the mark rather than tucked into a
 * corner. A browser draws a favicon at roughly 16px, where a corner badge
 * collapses into an unreadable smudge. These values were picked by rendering
 * every count width at 16px through 96px — the bubble covers most of the
 * bottom-right while the mark's top wedge still identifies the tab, and the
 * white ring keeps the red readable where it crosses the purple and blue.
 */
const BADGE_CENTER = 326;
const BADGE_RING_RADIUS = 186;
const BADGE_RADIUS = 162;

/** Shrinks the text as digits are added so "99+" still fits inside the circle. */
function badgeFontSize(label: string): number {
  if (label.length >= 3) return 122;
  if (label.length === 2) return 186;
  return 259;
}

/** `countUnread` saturates at 100, so anything above 99 is reported as "99+". */
function formatBadgeLabel(count: number): string {
  return count > 99 ? "99+" : String(count);
}

/** Eva's mark with the count overlaid as a bubble, as a data URI. */
function badgedIconHref(label: string): string {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">' +
    MARK +
    `<circle cx="${BADGE_CENTER}" cy="${BADGE_CENTER}" r="${BADGE_RING_RADIUS}" fill="#ffffff"/>` +
    `<circle cx="${BADGE_CENTER}" cy="${BADGE_CENTER}" r="${BADGE_RADIUS}" fill="#e5484d"/>` +
    `<text x="${BADGE_CENTER}" y="${BADGE_CENTER}" text-anchor="middle" dominant-baseline="central" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="${badgeFontSize(label)}" fill="#ffffff">${label}</text>` +
    "</svg>";
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Draws the unread inbox count onto the browser tab's favicon.
 *
 * The favicon is document-level state that no React tree owns, so mirroring a
 * live query onto it is a genuine external-system effect. Only the SVG icon link
 * is touched: Chrome, Edge, and Firefox prefer it over the PNG and ICO siblings,
 * while Safari ignores SVG favicons entirely and keeps showing the plain PNG.
 * The badge therefore degrades to no badge in Safari rather than breaking.
 *
 * Reads the same cached `countUnread` subscription as the sidebar rail badge, so
 * it inherits that query's optimistic updates and adds no extra server load.
 * Renders nothing.
 */
export function InboxFaviconBadge() {
  const unreadCount = useQuery(api.notifications.countUnread);

  useEffect(() => {
    const link = document.querySelector(
      'link[rel="icon"][type="image/svg+xml"]',
    );
    if (!(link instanceof HTMLLinkElement)) return;

    const hasUnread = unreadCount !== undefined && unreadCount > 0;
    link.href = hasUnread
      ? badgedIconHref(formatBadgeLabel(unreadCount))
      : PLAIN_ICON_HREF;

    // Signing out unmounts this without clearing the badge, which would
    // otherwise leave a stale count on the tab of a signed-out session.
    return () => {
      link.href = PLAIN_ICON_HREF;
    };
  }, [unreadCount]);

  return null;
}
