import type { Id } from "@eva/backend";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import { PrCommitDiffDialog } from "./PrCommitDiffDialog";
import { shortSha, type PrCommit } from "./prOverviewMeta";

/**
 * One commit, as a row that opens its own diff. Shared by the push groups on the
 * Activity rail and the flat Commits tab, so a commit reads and behaves the same
 * whichever of the two the reader is looking at.
 *
 * The whole row is the trigger, so the sha is plain text — the link out to GitHub
 * lives in the dialog's header, where a click cannot be mistaken for "open this
 * commit".
 */
export function PrCommitRow({
  repoId,
  commit,
  showAuthor = false,
}: {
  repoId: Id<"githubRepos">;
  commit: PrCommit;
  /**
   * True on the Commits tab, where a branch can carry work from more than one
   * author. The Activity rail names the author once in the group heading instead.
   */
  showAuthor?: boolean;
}) {
  return (
    <PrCommitDiffDialog repoId={repoId} commit={commit}>
      <button
        type="button"
        className="flex w-full min-w-0 items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-muted/50"
      >
        <span className="shrink-0 font-mono text-xs text-muted-foreground">
          {shortSha(commit.sha)}
        </span>
        <span className="min-w-0 flex-1 truncate" title={commit.message}>
          {commit.message}
        </span>
        {showAuthor && commit.authorLogin !== null ? (
          <span className="hidden shrink-0 items-center gap-1.5 text-xs text-muted-foreground sm:flex">
            {commit.authorAvatarUrl === null ? null : (
              <img
                src={commit.authorAvatarUrl}
                alt=""
                className="size-4 rounded-full"
              />
            )}
            {commit.authorLogin}
          </span>
        ) : null}
        {commit.committedAt === null ? null : (
          <span className="shrink-0 text-xs text-muted-foreground">
            <RelativeDateTime at={new Date(commit.committedAt).getTime()} />
          </span>
        )}
      </button>
    </PrCommitDiffDialog>
  );
}
