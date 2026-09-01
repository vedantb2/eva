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

/**
 * The message and its detector live together: the web app offers a one-click
 * force-push recovery for exactly this refusal, so the wording and the
 * `publishErrorNeedsForcePush` check must never drift apart.
 */
const REWRITTEN_BRANCH_MARKER = "into a rewritten local branch";

export function rewrittenBranchPublishError(
  branchName: string,
  remoteOnlyCount: number,
  localCount: number,
): string {
  return `Refusing to merge origin/${branchName} ${REWRITTEN_BRANCH_MARKER} (${remoteOnlyCount} remote-only files vs ${localCount} local). Local work is intact and GitHub still has the old history. Updating the PR needs a force-push, and a base-branch retarget if you rebased onto a new base.`;
}

/**
 * True when a publish failure is the rewritten-branch refusal, where replacing
 * origin with the sandbox's branch is the documented fix. Deliberately not
 * matched for other diverged-publish failures ("Could not merge origin/…"),
 * where both sides may hold real commits and a force-push could destroy work.
 */
export function publishErrorNeedsForcePush(errorDetail: string): boolean {
  return errorDetail.includes(REWRITTEN_BRANCH_MARKER);
}
