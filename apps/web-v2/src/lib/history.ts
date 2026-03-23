import { createBrowserHistory } from "@tanstack/react-router";

const KNOWN_SUB_PAGES = new Set([
  "projects",
  "designs",
  "docs",
  "sessions",
  "quick-tasks",
  "analyse",
  "settings",
  "testing-arena",
  "stats",
  "automations",
  "inbox",
]);

const NON_REPO_PREFIXES = new Set([
  "home",
  "sign-in",
  "sign-up",
  "setup",
  "teams",
  "inbox",
  "api",
  "settings",
  "agent-callback",
]);

function toInternalHref(href: string): string {
  const qIdx = href.indexOf("?");
  const hIdx = href.indexOf("#");
  const end =
    qIdx >= 0 && hIdx >= 0
      ? Math.min(qIdx, hIdx)
      : qIdx >= 0
        ? qIdx
        : hIdx >= 0
          ? hIdx
          : href.length;
  const pathname = href.substring(0, end);
  const suffix = href.substring(end);

  const segments = pathname.split("/").filter(Boolean);
  if (
    segments.length >= 3 &&
    !NON_REPO_PREFIXES.has(segments[0]) &&
    !KNOWN_SUB_PAGES.has(segments[2]) &&
    !segments[1].includes("--")
  ) {
    const rewritten =
      "/" +
      segments[0] +
      "/" +
      segments[1] +
      "--" +
      segments[2] +
      (segments.length > 3 ? "/" + segments.slice(3).join("/") : "");
    return rewritten + suffix;
  }
  return href;
}

function toDisplayHref(href: string): string {
  const qIdx = href.indexOf("?");
  const hIdx = href.indexOf("#");
  const end =
    qIdx >= 0 && hIdx >= 0
      ? Math.min(qIdx, hIdx)
      : qIdx >= 0
        ? qIdx
        : hIdx >= 0
          ? hIdx
          : href.length;
  const pathname = href.substring(0, end);
  const suffix = href.substring(end);

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length >= 2 && segments[1].includes("--")) {
    const [name, appName] = segments[1].split("--", 2);
    const rewritten =
      "/" + [segments[0], name, appName, ...segments.slice(2)].join("/");
    return rewritten + suffix;
  }
  return href;
}

function parseHref(
  href: string,
  state: Record<string, unknown>,
): {
  href: string;
  pathname: string;
  hash: string;
  search: string;
  state: Record<string, unknown>;
} {
  const hashIndex = href.indexOf("#");
  const searchIndex = href.indexOf("?");
  return {
    href,
    pathname: href.substring(
      0,
      hashIndex > 0
        ? searchIndex > 0
          ? Math.min(hashIndex, searchIndex)
          : hashIndex
        : searchIndex > 0
          ? searchIndex
          : href.length,
    ),
    hash: hashIndex > -1 ? href.substring(hashIndex) : "",
    search:
      searchIndex > -1
        ? href.slice(searchIndex, hashIndex === -1 ? undefined : hashIndex)
        : "",
    state,
  };
}

export function createAppHistory() {
  return createBrowserHistory({
    parseLocation() {
      const raw = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      const internal = toInternalHref(raw);
      return parseHref(internal, window.history.state ?? {});
    },
    createHref(href) {
      return toDisplayHref(href);
    },
  });
}
