import type { Doc } from "../_generated/dataModel";
import { FALLBACK_GIT_BASE_BRANCH } from "@eva/shared";

type SessionBaseBranchSource = Pick<Doc<"sessions">, "baseBranch">;
type RepoBaseBranchSource =
  | Pick<Doc<"githubRepos">, "defaultBaseBranch">
  | null
  | undefined;

/**
 * The branch a session checks out from, branches off, and targets with its PR.
 * The branch chosen at session creation always wins; the repo default is only a
 * fallback for sessions created before `baseBranch` was persisted. Every
 * session code path must resolve through here so the sandbox checkout and the
 * pull request agree on one base.
 */
export function resolveSessionBaseBranch(
  session: SessionBaseBranchSource,
  repo: RepoBaseBranchSource,
): string {
  return (
    session.baseBranch?.trim() ||
    repo?.defaultBaseBranch?.trim() ||
    FALLBACK_GIT_BASE_BRANCH
  );
}
