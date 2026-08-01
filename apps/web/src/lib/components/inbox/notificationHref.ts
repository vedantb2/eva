/**
 * Notification hrefs are stored as `/owner/repo/...`, but app-scoped routes in
 * the web app live under a combined `repo--app` segment. Anything whose third
 * segment is a known repo sub-page is already in route form and passes through.
 */
const KNOWN_SUB_PAGES = new Set([
  "projects",
  "docs",
  "sessions",
  "quick-tasks",
  "settings",
  "testing-arena",
  "stats",
  "automations",
  "inbox",
]);

export function transformNotificationHref(href: string): string {
  const segments = href.split("/").filter(Boolean);
  if (segments.length < 3) return href;
  if (KNOWN_SUB_PAGES.has(segments[2])) return href;
  const [owner, repo, appName, ...rest] = segments;
  return `/${owner}/${repo}--${appName}/${rest.join("/")}`;
}
