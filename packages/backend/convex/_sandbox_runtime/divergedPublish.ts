/**
 * When local and origin/<branch> have both moved, Eva merges the remote tip
 * rather than rebasing (rebasing a merged-in base replays hundreds of
 * unrelated commits). That merge is wrong after a history rewrite — rebasing
 * the branch onto a new base — because it glues the old remote history back
 * onto the rewritten tip. Task 231 (25 Aug 2026) hit that: one feature commit
 * on main vs 1,272 remote-only staging commits, conflicts that existed only
 * inside the publish merge, sandbox left clean after abort.
 *
 * Remote unique history that touches many files local did not is that rewrite,
 * not two sandboxes committing on the same lineage.
 */
export const REWRITE_REMOTE_ONLY_FILE_THRESHOLD = 20;

export function parseGitNameOnlyList(output: string): string[] {
  const names: string[] = [];
  for (const line of output.split("\n")) {
    const name = line.trim();
    if (name.length > 0) names.push(name);
  }
  return names;
}

export function remoteOnlyChangedFileCount(
  localChangedFiles: readonly string[],
  remoteChangedFiles: readonly string[],
): number {
  const local = new Set(localChangedFiles);
  let count = 0;
  for (const file of remoteChangedFiles) {
    if (!local.has(file)) count += 1;
  }
  return count;
}

export function divergedPublishLooksLikeRewrite(
  localChangedFiles: readonly string[],
  remoteChangedFiles: readonly string[],
): boolean {
  const remoteOnly = remoteOnlyChangedFileCount(
    localChangedFiles,
    remoteChangedFiles,
  );
  return (
    remoteOnly > REWRITE_REMOTE_ONLY_FILE_THRESHOLD &&
    remoteOnly > localChangedFiles.length
  );
}
