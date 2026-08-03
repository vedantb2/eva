"use client";

import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAction } from "convex/react";
import { api, type Id } from "@eva/backend";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Spinner,
} from "@eva/ui";
import {
  DiffCountBar,
  FileStatusChip,
} from "@/lib/components/sandbox/DiffFileBadges";
import { ReviewableFileDiff } from "@/lib/components/sandbox/ReviewableFileDiff";
import { NoPendingReviewComments } from "@/lib/contexts/PendingReviewCommentsContext";
import { useThemeMode } from "@/lib/hooks/useThemeMode";
import { commitDiffQuery, prErrorMessage } from "@/lib/prReviewQueries";
import { shortSha, type PrCommit } from "./prOverviewMeta";

/**
 * What one commit changed, without leaving eva. The dialog owns the trigger so a
 * timeline row only supplies its own content, and the diff is fetched by the body
 * below — Radix mounts dialog content on open, so a row nobody clicks costs
 * nothing, however long the branch is.
 */
export function PrCommitDiffDialog({
  repoId,
  commit,
  children,
}: {
  repoId: Id<"githubRepos">;
  commit: PrCommit;
  /** The commit row, used as the trigger. */
  children: ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      {/* Wider than the default dialog: this holds code, not a form. */}
      <DialogContent className="max-w-5xl">
        {/* Padded clear of the close button, which floats over the corner. */}
        <DialogHeader className="pr-8">
          <DialogTitle className="truncate text-base" title={commit.message}>
            {commit.message}
          </DialogTitle>
          <DialogDescription className="text-xs">
            <span className="font-mono">{shortSha(commit.sha)}</span>
            {commit.authorLogin === null ? null : <> · {commit.authorLogin}</>}
            {" · "}
            <a
              href={commit.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              View on GitHub
            </a>
          </DialogDescription>
        </DialogHeader>

        <CommitDiffBody
          repoId={repoId}
          sha={commit.sha}
          htmlUrl={commit.htmlUrl}
        />
      </DialogContent>
    </Dialog>
  );
}

/**
 * The diff itself. Split from the shell because it only mounts while the dialog
 * is open, which is what keeps the fetch on the click rather than on the render
 * of every commit row.
 */
function CommitDiffBody({
  repoId,
  sha,
  htmlUrl,
}: {
  repoId: Id<"githubRepos">;
  sha: string;
  htmlUrl: string;
}) {
  const getCommitDiff = useAction(api.github.getCommitDiff);
  const { resolvedTheme } = useThemeMode();
  const query = useQuery(commitDiffQuery(getCommitDiff, repoId, sha));

  if (query.isPending) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner size="sm" />
      </div>
    );
  }

  if (query.data === undefined) {
    return (
      <p className="py-10 text-center text-2sm text-destructive">
        {prErrorMessage(query.error, "Couldn't load this commit")}
      </p>
    );
  }

  const { entries, truncated, additions, deletions, changedFiles } = query.data;

  return (
    <DialogBody className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>
          {changedFiles} changed {changedFiles === 1 ? "file" : "files"}
        </span>
        <DiffCountBar additions={additions} deletions={deletions} />
      </div>

      {/* Read-only: these line numbers belong to the commit, so a review comment
          drafted here would land on the wrong lines of the pull request diff. */}
      <NoPendingReviewComments>
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.path}
              className="overflow-hidden rounded-surface border border-border"
            >
              <div className="flex min-w-0 items-center gap-2 border-b border-border bg-muted/40 px-3 py-2">
                <span
                  className="min-w-0 flex-1 truncate font-mono text-xs"
                  title={entry.path}
                >
                  {entry.path}
                </span>
                <FileStatusChip status={entry.status} />
                <DiffCountBar
                  additions={entry.additions}
                  deletions={entry.deletions}
                />
              </div>

              {entry.binary || !entry.hasHunks ? (
                <p className="px-3 py-4 text-xs text-muted-foreground">
                  {entry.binary
                    ? "Binary file not shown."
                    : "No line changes in this file."}
                </p>
              ) : (
                <ReviewableFileDiff
                  patch={entry.patch}
                  path={entry.path}
                  diffView="unified"
                  resolvedTheme={resolvedTheme}
                  hideFileHeader
                />
              )}
            </div>
          ))}
        </div>
      </NoPendingReviewComments>

      {truncated ? (
        <p className="text-xs text-muted-foreground">
          This commit is too large to show in full.{" "}
          <a
            href={htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            View it on GitHub
          </a>
          .
        </p>
      ) : null}
    </DialogBody>
  );
}
