/**
 * Detects and labels external links that should render as chips. Only Figma
 * today. Adding a provider = append one entry to LINK_MATCHERS; the scanning
 * regex and label lookup are derived from it.
 *
 * Links are matched by their raw URL (no token grammar) and are safe to scan in
 * free prose because the provider host is part of the pattern.
 */

const FIGMA_URL_SOURCE = "https?://(?:www\\.)?figma\\.com/[^\\s)]+";

/**
 * Friendly chip label from a Figma file URL. Figma paths look like
 * `/{design|file|proto|board}/{KEY}/{File-Name}`, so the third segment is the
 * human name. Falls back to the brand name when it cannot be parsed.
 */
export function figmaLinkLabel(url: string): string {
  try {
    const segments = new URL(url).pathname
      .split("/")
      .filter((segment) => segment.length > 0);
    const nameSegment = segments[2];
    if (nameSegment !== undefined) {
      const decoded = decodeURIComponent(nameSegment).replace(/-/g, " ").trim();
      if (decoded.length > 0) return decoded;
    }
  } catch {
    // Malformed URL — fall through to the brand fallback.
  }
  return "Figma";
}

interface LinkMatcher {
  /** Regex source (no flags, no capturing groups) matching a full provider URL. */
  source: string;
  /** Builds the chip label for a matched URL. */
  label: (url: string) => string;
}

const LINK_MATCHERS: readonly LinkMatcher[] = [
  { source: FIGMA_URL_SOURCE, label: figmaLinkLabel },
];

/**
 * Combined alternation source for every chip-able link provider. Consumers
 * build their own `new RegExp(LINK_URL_SOURCE, "g")` so the shared module-level
 * regex never carries `lastIndex` state across calls.
 */
export const LINK_URL_SOURCE = LINK_MATCHERS.map(
  (matcher) => matcher.source,
).join("|");

const FIGMA_URL_ANCHORED = new RegExp(`^(?:${FIGMA_URL_SOURCE})$`);

export function isFigmaUrl(url: string): boolean {
  return FIGMA_URL_ANCHORED.test(url);
}

/** Chip label for any supported link URL. */
export function linkLabel(url: string): string {
  return figmaLinkLabel(url);
}

/** Every supported link URL found in `text`, in document order. */
export function findLinkUrls(text: string): string[] {
  return [...text.matchAll(new RegExp(LINK_URL_SOURCE, "g"))].map(
    (match) => match[0],
  );
}

export function countLinkUrls(text: string): number {
  return findLinkUrls(text).length;
}
