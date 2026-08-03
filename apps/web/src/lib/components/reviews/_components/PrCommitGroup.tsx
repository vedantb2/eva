import type { Id } from "@eva/backend";
import { Button } from "@eva/ui";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import { PrCommitDiffDialog } from "./PrCommitDiffDialog";
import { shortSha, type PrCommit } from "./prOverviewMeta";

/**
 * A run of pushed commits under one heading, the way GitHub reports a push. The
 * commits sit in a bordered list so a long run stays contained instead of
 * pushing the discussion off the screen. Each row opens that commit's diff.
 */
export function PrCommitGroup({
  repoId,
  commits,
}: {
  repoId: Id<"githubRepos">;
  commits: readonly PrCommit[];
}) {
  const authors = [
    ...new Set(commits.map((commit) => commit.authorLogin ?? "unknown")),
  ];
  const soleAuthor = authors.length === 1 ? authors[0] : undefined;
  const noun = commits.length === 1 ? "commit" : "commits";

  return (
    <div className="min-w-0">
      <p className="pt-1 text-2sm text-muted-foreground">
        {soleAuthor === undefined ? null : (
          <span className="font-medium text-foreground">{soleAuthor} </span>
        )}
        added {commits.length} {noun}
      </p>

      <ul className="mt-1.5 divide-y divide-border overflow-hidden rounded-surface border border-border bg-card">
        {commits.map((commit) => (
          <li key={commit.sha} className="min-w-0">
            {/* The whole row is the trigger, so the sha is plain text here — the
                link out to GitHub lives in the dialog's header. */}
            <PrCommitDiffDialog repoId={repoId} commit={commit}>
              {/* Square and full-bleed: the row is a list item, so the button's
                  own radius and press-scale would fight the divided list. */}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto w-full min-w-0 justify-start rounded-none px-3 py-1.5 text-left text-2sm font-normal text-foreground hover:bg-muted/50 active:scale-100"
              >
                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                  {shortSha(commit.sha)}
                </span>
                <span className="min-w-0 flex-1 truncate" title={commit.message}>
                  {commit.message}
                </span>
                {commit.committedAt === null ? null : (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    <RelativeDateTime
                      at={new Date(commit.committedAt).getTime()}
                    />
                  </span>
                )}
              </Button>
            </PrCommitDiffDialog>
          </li>
        ))}
      </ul>
    </div>
  );
}
