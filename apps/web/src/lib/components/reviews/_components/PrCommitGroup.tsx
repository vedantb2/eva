import type { Id } from "@eva/backend";
import { Surface } from "@eva/ui";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import { PrCommitDiffDialog } from "./PrCommitDiffDialog";
import { shortSha, type PrCommit } from "./prOverviewMeta";

/**
 * A run of pushed commits under one heading, the way GitHub reports a push. The
 * commits sit on a tonal fill so a long run stays contained instead of pushing the
 * discussion off the screen. Each row opens that commit's diff.
 *
 * Fill only — no outline and no rules between rows. The sha column and the hover
 * fill already separate one commit from the next, and an agent branch of thirty
 * commits drew thirty lines to say what the alignment says for free.
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
      <p className="pt-1 text-sm text-muted-foreground">
        {soleAuthor === undefined ? null : (
          <span className="font-medium text-foreground">{soleAuthor} </span>
        )}
        added {commits.length} {noun}
      </p>

      <Surface density="none" className="mt-1.5 overflow-hidden py-1">
        <ul>
          {commits.map((commit) => (
            <li key={commit.sha} className="min-w-0">
              {/* The whole row is the trigger, so the sha is plain text here — the
                  link out to GitHub lives in the dialog's header. */}
              <PrCommitDiffDialog repoId={repoId} commit={commit}>
                <button
                  type="button"
                  className="flex w-full min-w-0 items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-muted/50"
                >
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {shortSha(commit.sha)}
                  </span>
                  <span
                    className="min-w-0 flex-1 truncate"
                    title={commit.message}
                  >
                    {commit.message}
                  </span>
                  {commit.committedAt === null ? null : (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      <RelativeDateTime
                        at={new Date(commit.committedAt).getTime()}
                      />
                    </span>
                  )}
                </button>
              </PrCommitDiffDialog>
            </li>
          ))}
        </ul>
      </Surface>
    </div>
  );
}
