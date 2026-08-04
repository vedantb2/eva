/** Top-level global routes, keyed by their first path segment. */
const GLOBAL_LABELS: Record<string, string> = {
  home: "Home",
  teams: "Teams",
  artifacts: "Artifacts",
  inbox: "Inbox",
  sessions: "Sessions",
  settings: "Settings",
  setup: "Setup",
  testing: "Testing",
};

/** Sections under `/{owner}/{repo}`, keyed by their third path segment. */
const REPO_SECTION_LABELS: Record<string, string> = {
  automations: "Automations",
  docs: "Docs",
  drafts: "Drafts",
  inbox: "Inbox",
  projects: "Projects",
  "quick-tasks": "Quick tasks",
  reviews: "Reviews",
  sessions: "Sessions",
  settings: "Settings",
  stats: "Stats",
  "testing-arena": "Testing arena",
};

/**
 * Turns a teammate's `lastSeenPath` into a readable location, e.g.
 * `/acme/web/sessions/12` → "acme/web · Sessions". Returns null when there is
 * no path to describe, so callers can fall back to "Online".
 *
 * Deliberately segment-based rather than route-matched: presence stores a bare
 * pathname, and a label only needs the first three segments.
 */
export function describeLocation(pathname?: string): string | null {
  if (!pathname) return null;
  const segments = pathname.split("/").filter((segment) => segment.length > 0);
  const first = segments[0];
  if (first === undefined) return "Home";

  const global = GLOBAL_LABELS[first];
  if (global !== undefined) return global;

  const second = segments[1];
  if (second === undefined) return first;

  // Repo routes are `/{owner}/{repo}[/section/...]`, where the repo segment may
  // carry a sandboxed-app suffix (`repo--app`) that is noise in a label.
  const repo = `${first}/${second.replace(/--.*$/, "")}`;
  const third = segments[2];
  const section = third === undefined ? undefined : REPO_SECTION_LABELS[third];
  return section === undefined ? repo : `${repo} · ${section}`;
}
