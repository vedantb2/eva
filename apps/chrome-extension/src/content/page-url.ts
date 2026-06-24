/**
 * The current page's identity key for repo matching, project listing, and
 * pin/annotation storage: origin + pathname, with the query string and hash
 * deliberately dropped so the same logical page maps to one key regardless of
 * transient params.
 */
export function getPageUrl(): string {
  return `${window.location.origin}${window.location.pathname}`;
}
