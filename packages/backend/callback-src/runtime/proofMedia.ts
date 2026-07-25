/**
 * Shared helpers for finding proof media left by agent-browser.
 * Agents often write under the app rootDirectory; the uploader must check both.
 */

export const PROOF_NO_MEDIA_MESSAGE = "Eva decided not to capture.";

/** Repo-root + optional app subdirectory (e.g. apps/eprocurement). */
export function proofMediaCandidateRoots(
  workDir: string,
  rootDirectory: string | null | undefined,
): string[] {
  const roots = [workDir];
  const trimmed = rootDirectory?.trim() ?? "";
  if (
    trimmed.length > 0 &&
    trimmed !== "." &&
    !trimmed.startsWith("/") &&
    !trimmed.includes("..")
  ) {
    const appRoot = `${workDir}/${trimmed.replace(/\/+$/, "")}`;
    if (appRoot !== workDir) {
      roots.push(appRoot);
    }
  }
  return roots;
}

export function proofMediaSearchDirs(
  workDir: string,
  rootDirectory: string | null | undefined,
): { recordings: string[]; screenshots: string[] } {
  const roots = proofMediaCandidateRoots(workDir, rootDirectory);
  return {
    recordings: roots.map((root) => `${root}/recordings`),
    screenshots: roots.map((root) => `${root}/screenshots`),
  };
}
