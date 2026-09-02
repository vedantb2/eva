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
 * Eva only ever rewrites history on GitHub for branches it created. The same
 * rule guards the user-confirmed session force-push (`_sessions/sandbox.ts`).
 */
export function isEvaOwnedBranch(branchName: string): boolean {
  return branchName.startsWith("eva/");
}

/**
 * A rewritten local branch may replace origin/<branch> without confirmation
 * only when the remote tip is a commit the local branch itself used to point
 * at. The sandbox then already held every remote commit and deliberately moved
 * off them (rebase onto a new base, reset, amend), so a leased force-push
 * discards nothing the sandbox never saw. A remote tip absent from the branch's
 * reflog was pushed by someone or something else and must not be overwritten.
 *
 * Task m57dve3m (2 Sep 2026): the agent rebased eva/task-… onto a new base,
 * publish refused with "532 remote-only files vs 1 local", and the task chat
 * had no recovery button — the sandbox's own old tip was still on GitHub.
 */
export function rewrittenBranchIsOwnHistory(
  remoteTipSha: string,
  localBranchReflogShas: readonly string[],
): boolean {
  const tip = remoteTipSha.trim();
  return tip.length > 0 && localBranchReflogShas.includes(tip);
}

/** Why an automatic replace of origin/<branch> was not attempted. */
export type RewrittenBranchRefusal =
  | "remote-holds-foreign-commits"
  | "branch-not-eva-owned";

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
  refusal: RewrittenBranchRefusal,
): string {
  const why =
    refusal === "remote-holds-foreign-commits"
      ? `Eva did not force-push automatically because origin/${branchName} holds commits this sandbox never had, and overwriting them could lose someone else's work.`
      : `Eva only force-pushes eva/ branches automatically, and ${branchName} is not one.`;
  return `Refusing to merge origin/${branchName} ${REWRITTEN_BRANCH_MARKER} (${remoteOnlyCount} remote-only files vs ${localCount} local). Local work is intact and GitHub still has the old history. ${why} Updating the PR needs a force-push, and a base-branch retarget if you rebased onto a new base: check origin/${branchName} for work to keep, then use the session's force-push recovery or run \`git push --force-with-lease origin ${branchName}\` in the sandbox.`;
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
