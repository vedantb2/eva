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

/** Shrinks the text as digits are added so "99+" still fits inside the circle. */
function badgeFontSize(label: string): number {
  if (label.length >= 3) return 140;
  if (label.length === 2) return 190;
  return 230;
}

/** `countUnread` saturates at 100, so anything above 99 is reported as "99+". */
function formatBadgeLabel(count: number): string {
  return count > 99 ? "99+" : String(count);
}

/**
 * Eva's mark with a count bubble in the bottom-right corner, as a data URI.
 *
 * The bubble sits on a white ring so it stays legible against the mark's purple
 * and blue wedges, and is sized to reach the icon's corner — at the 16px the
 * browser actually renders, a subtler badge is unreadable.
 */
function badgedIconHref(label: string): string {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">' +
    MARK +
    '<circle cx="352" cy="352" r="160" fill="#ffffff"/>' +
    '<circle cx="352" cy="352" r="132" fill="#e5484d"/>' +
    `<text x="352" y="352" text-anchor="middle" dominant-baseline="central" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="${badgeFontSize(label)}" fill="#ffffff">${label}</text>` +
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
