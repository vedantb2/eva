/**
 * Detects and labels external links that should render as chips. Each supported
 * service is one entry in LINK_MATCHERS — the scanning regex, provider lookup,
 * and label logic are all derived from it, so adding a service is a one-line
 * change here plus an icon case in linkProviderIcons.tsx.
 *
 * Links are matched by their raw URL (no token grammar) and are safe to scan in
 * free prose because the provider host is part of the pattern.
 */

export type LinkProvider = "figma" | "github" | "linear" | "sentry" | "posthog";

interface LinkMatcher {
  provider: LinkProvider;
  /** Regex source (no flags, no capturing groups) matching a full provider URL. */
  source: string;
}

function pathSegments(url: string): string[] {
  try {
    return new URL(url).pathname
      .split("/")
      .filter((segment) => segment.length > 0);
  } catch {
    return [];
  }
}

/**
 * Chip label: host + path without protocol (e.g.
 * `linear.app/evalucom/issue/DEV-7002`). Linear issue URLs drop the trailing
 * slug so the chip stays readable.
 */
function linkDisplayPath(url: string, provider: LinkProvider): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    const segments = pathSegments(url);

    let displaySegments = segments;
    if (provider === "linear") {
      const issueIndex = segments.indexOf("issue");
      const id = issueIndex >= 0 ? segments[issueIndex + 1] : undefined;
      if (issueIndex >= 0 && id !== undefined && id.length > 0) {
        displaySegments = segments.slice(0, issueIndex + 2);
      }
    }

    const path =
      displaySegments.length > 0 ? `/${displaySegments.join("/")}` : "";
    return `${host}${path}`;
  } catch {
    return url;
  }
}

const LINK_MATCHERS: readonly LinkMatcher[] = [
  {
    provider: "figma",
    source: "https?://(?:www\\.)?figma\\.com/[^\\s)]+",
  },
  {
    provider: "github",
    source: "https?://(?:www\\.)?github\\.com/[^\\s)]+",
  },
  {
    provider: "linear",
    source: "https?://linear\\.app/[^\\s)]+",
  },
  {
    provider: "sentry",
    source: "https?://(?:[a-z0-9-]+\\.)?sentry\\.io/[^\\s)]+",
  },
  {
    provider: "posthog",
    source: "https?://(?:[a-z0-9-]+\\.)?posthog\\.com/[^\\s)]+",
  },
];

/**
 * Combined alternation source for every chip-able link provider. Consumers
 * build their own `new RegExp(LINK_URL_SOURCE, "g")` so the shared module-level
 * regex never carries `lastIndex` state across calls.
 */
export const LINK_URL_SOURCE = LINK_MATCHERS.map(
  (matcher) => matcher.source,
).join("|");

const ANCHORED_MATCHERS = LINK_MATCHERS.map((matcher) => ({
  provider: matcher.provider,
  regex: new RegExp(`^(?:${matcher.source})$`),
}));

/** Which provider a URL belongs to, or null when it is not a chip-able link. */
export function linkProvider(url: string): LinkProvider | null {
  for (const matcher of ANCHORED_MATCHERS) {
    if (matcher.regex.test(url)) return matcher.provider;
  }
  return null;
}

export function isChipLinkUrl(url: string): boolean {
  return linkProvider(url) !== null;
}

/** Chip label for any supported link URL (falls back to the URL itself). */
export function linkLabel(url: string): string {
  for (const matcher of ANCHORED_MATCHERS) {
    if (matcher.regex.test(url)) return linkDisplayPath(url, matcher.provider);
  }
  return url;
}

/** Every supported link URL found in `text`, in document order. */
function findLinkUrls(text: string): string[] {
  return [...text.matchAll(new RegExp(LINK_URL_SOURCE, "g"))].map(
    (match) => match[0],
  );
}

export function countLinkUrls(text: string): number {
  return findLinkUrls(text).length;
}
