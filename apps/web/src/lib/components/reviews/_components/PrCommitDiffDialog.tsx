"use client";

import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAction } from "convex/react";
import { api, type Id } from "@eva/backend";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Spinner,
} from "@eva/ui";
import { commitDiffQuery, prErrorMessage } from "@/lib/prReviewQueries";
import { DiffEntriesDialogBody } from "./DiffEntriesDialogBody";
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
      <p className="py-10 text-center text-sm text-destructive">
        {prErrorMessage(query.error, "Couldn't load this commit")}
      </p>
    );
  }

  const { entries, truncated, additions, deletions, changedFiles } = query.data;

  return (
    <DiffEntriesDialogBody
      entries={entries}
      additions={additions}
      deletions={deletions}
      changedFiles={changedFiles}
      truncatedNotice={
        truncated ? (
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
        ) : null
      }
    />
  );
}
