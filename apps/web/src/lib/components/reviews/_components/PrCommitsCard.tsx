"use client";

import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import { OverviewCard } from "./OverviewCard";
import { shortSha, type PrCommit } from "./prOverviewMeta";

/**
 * Commits on the branch, newest first — GitHub returns them oldest-first, but a
 * reviewer reads the most recent work first.
 */
export function PrCommitsCard({
  commits,
  commitCount,
  truncated,
}: {
  commits: PrCommit[];
  commitCount: number;
  truncated: boolean;
}) {
  return (
    <OverviewCard
      title="Commits"
      count={commitCount}
      footer={
        truncated
          ? `Showing the latest ${commits.length} of ${commitCount} commits`
          : undefined
      }
    >
      {commits.length === 0 ? (
        <p className="text-sm text-muted-foreground">No commits yet.</p>
      ) : (
        <ul className="max-h-80 space-y-0.5 overflow-y-auto scrollbar">
          {commits.toReversed().map((commit) => (
            <li key={commit.sha}>
              <a
                href={commit.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-muted/60"
              >
                {commit.authorAvatarUrl ? (
                  <img
                    src={commit.authorAvatarUrl}
                    alt=""
                    className="size-4 shrink-0 rounded-full"
                  />
                ) : null}
                <span className="min-w-0 flex-1 truncate text-sm">
                  {commit.message}
                </span>
                <code className="shrink-0 rounded border border-border bg-muted/50 px-1 py-0.5 text-[11px] text-muted-foreground">
                  {shortSha(commit.sha)}
                </code>
                {commit.committedAt ? (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    <RelativeDateTime
                      at={new Date(commit.committedAt).getTime()}
                    />
                  </span>
                ) : null}
              </a>
            </li>
          ))}
        </ul>
      )}
    </OverviewCard>
  );
}
