import { z } from "zod";
import { stripPreviewGrantFromPath } from "@/lib/utils/previewGrant";

export const PREVIEW_PATH_HISTORY_STORED_LIMIT = 30;
export const PREVIEW_PATH_HISTORY_VISIBLE_LIMIT = 5;

export const EMPTY_PREVIEW_PATH_HISTORY: string[] = [];

const historySchema = z.array(z.string());

export function previewPathHistoryStorageKey(repoId: string): string {
  return `eva:preview-path-history:v1:${repoId}`;
}

export function normalizePreviewPath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) return "/";
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return stripPreviewGrantFromPath(withSlash);
}

function sanitizePreviewPathHistory(paths: string[]): string[] {
  const seen = new Set<string>();
  const next: string[] = [];
  for (const path of paths) {
    const normalized = normalizePreviewPath(path);
    if (normalized === "/" || seen.has(normalized)) continue;
    seen.add(normalized);
    next.push(normalized);
    if (next.length >= PREVIEW_PATH_HISTORY_STORED_LIMIT) break;
  }
  return next;
}

/** localStorage boundary — JSON.parse stays inside Zod. */
export function parsePreviewPathHistoryJson(raw: string): string[] {
  try {
    const parsed = historySchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return [];
    return sanitizePreviewPathHistory(parsed.data);
  } catch {
    return [];
  }
}

export function recordPreviewPath(history: string[], path: string): string[] {
  return sanitizePreviewPathHistory([path, ...history]);
}

export function filterPreviewPathHistory(
  history: string[],
  query: string,
): string[] {
  const needle = query.trim().toLowerCase();
  const matches =
    needle === ""
      ? history
      : history.filter((item) => item.toLowerCase().includes(needle));
  return matches.slice(0, PREVIEW_PATH_HISTORY_VISIBLE_LIMIT);
}
