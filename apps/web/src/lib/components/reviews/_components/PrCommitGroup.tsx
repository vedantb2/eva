import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import { shortSha, type PrCommit } from "./prOverviewMeta";

/**
 * A run of pushed commits under one heading, the way GitHub reports a push. The
 * commits sit in a bordered list so a long run stays contained instead of
 * pushing the discussion off the screen.
 */
export function PrCommitGroup({ commits }: { commits: readonly PrCommit[] }) {
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

      <ul className="mt-1.5 divide-y divide-border overflow-hidden rounded-md border border-border bg-card">
        {commits.map((commit) => (
          <li
            key={commit.sha}
            className="flex min-w-0 items-center gap-2 px-3 py-1.5 text-sm"
          >
            <a
              href={commit.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 font-mono text-xs text-muted-foreground hover:text-foreground"
            >
              {shortSha(commit.sha)}
            </a>
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
          </li>
        ))}
      </ul>
    </div>
  );
}
