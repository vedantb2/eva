import type { GitStatus } from "@pierre/trees";

/** Splits a multi-file git diff into one self-contained patch string per file. */
export function splitDiffFiles(diff: string): string[] {
  if (diff.trim().length === 0) return [];
  return diff
    .split(/\n(?=diff --git )/)
    .map((section) => section.trim())
    .filter((section) => section.startsWith("diff --git "));
}

/** Reads the (new) file path from a single-file git patch, for a stable key. */
export function fileNameFromPatch(patch: string, fallback: string): string {
  const match = patch.match(/^diff --git a\/.+? b\/(.+)$/m);
  return match ? match[1] : fallback;
}

/**
 * Classifies a single-file git patch into a git status the file tree can colour.
 * Reads the patch's extended header lines (new/deleted/rename) rather than
 * counting +/- lines, so it mirrors git's own semantics; anything else is a
 * plain content change ("modified").
 */
export function diffFileStatus(patch: string): GitStatus {
  if (/^new file mode /m.test(patch)) return "added";
  if (/^deleted file mode /m.test(patch)) return "deleted";
  if (/^rename (from|to) /m.test(patch)) return "renamed";
  return "modified";
}
