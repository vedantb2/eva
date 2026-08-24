import { PREVIEW_GRANT_PARAM } from "../previewGrantConfig";

/** Shared sticky Preview path / console-tail helpers for sessions, tasks, projects. */

/** Max lines kept in `*.terminalHistoryTail` (client also truncates). */
const TERMINAL_HISTORY_TAIL_LINES = 500;
const TERMINAL_HISTORY_TAIL_MAX_CHARS = 100_000;

/** Returns the last `maxLines` newline-delimited lines of `text`. */
function lastNLines(text: string, maxLines: number): string {
  if (maxLines <= 0 || text.length === 0) return "";
  let linesFound = 0;
  for (let i = text.length - 1; i >= 0; i--) {
    if (text[i] === "\n") {
      linesFound += 1;
      if (linesFound === maxLines) {
        return text.slice(i + 1);
      }
    }
  }
  return text;
}

/** Server-side truncate so a buggy client cannot inflate entity docs. */
export function truncateTerminalHistoryTail(text: string): string {
  const byLines = lastNLines(text, TERMINAL_HISTORY_TAIL_LINES);
  return byLines.length > TERMINAL_HISTORY_TAIL_MAX_CHARS
    ? byLines.slice(-TERMINAL_HISTORY_TAIL_MAX_CHARS)
    : byLines;
}

/** Normalize a Preview path to always start with `/` and never store a grant. */
export function normalizeStickyPreviewPath(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return "/";
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  try {
    const parsed = new URL(withSlash, "https://eva.invalid");
    parsed.searchParams.delete(PREVIEW_GRANT_PARAM);
    return `${parsed.pathname}${parsed.search}${parsed.hash}` || "/";
  } catch {
    return withSlash;
  }
}

/** Valid TCP port for Preview sticky `devPort`. */
export function assertStickyPreviewPort(port: number): void {
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("Invalid port");
  }
}
