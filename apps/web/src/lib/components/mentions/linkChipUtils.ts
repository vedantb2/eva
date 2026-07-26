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
  /** Human display label for a matched URL. */
  label: (url: string) => string;
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

function humanize(segment: string): string {
  try {
    return decodeURIComponent(segment).replace(/-/g, " ").trim();
  } catch {
    return segment.replace(/-/g, " ").trim();
  }
}

/** Figma paths are `/{design|file|proto|board}/{KEY}/{File-Name}` → file name. */
function figmaLabel(url: string): string {
  const name = pathSegments(url)[2];
  if (name !== undefined) {
    const label = humanize(name);
    if (label.length > 0) return label;
  }
  return "Figma";
}

/** `owner/repo`, or `repo#123` for a pull/issue URL. */
function githubLabel(url: string): string {
  const [owner, repo, type, number] = pathSegments(url);
  if (owner !== undefined && repo !== undefined) {
    if (
      (type === "pull" || type === "issues") &&
      number !== undefined &&
      /^\d+$/.test(number)
    ) {
      return `${repo}#${number}`;
    }
    return `${owner}/${repo}`;
  }
  return "GitHub";
}

/** Linear issue URLs are `/{workspace}/issue/{ID}/{slug}` → the issue ID. */
function linearLabel(url: string): string {
  const segments = pathSegments(url);
  const index = segments.indexOf("issue");
  const id = index >= 0 ? segments[index + 1] : undefined;
  if (id !== undefined && id.length > 0) return id.toUpperCase();
  return "Linear";
}

const LINK_MATCHERS: readonly LinkMatcher[] = [
  {
    provider: "figma",
    source: "https?://(?:www\\.)?figma\\.com/[^\\s)]+",
    label: figmaLabel,
  },
  {
    provider: "github",
    source: "https?://(?:www\\.)?github\\.com/[^\\s)]+",
    label: githubLabel,
  },
  {
    provider: "linear",
    source: "https?://linear\\.app/[^\\s)]+",
    label: linearLabel,
  },
  {
    provider: "sentry",
    source: "https?://(?:[a-z0-9-]+\\.)?sentry\\.io/[^\\s)]+",
    label: () => "Sentry",
  },
  {
    provider: "posthog",
    source: "https?://(?:[a-z0-9-]+\\.)?posthog\\.com/[^\\s)]+",
    label: () => "PostHog",
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
  label: matcher.label,
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
    if (matcher.regex.test(url)) return matcher.label(url);
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
