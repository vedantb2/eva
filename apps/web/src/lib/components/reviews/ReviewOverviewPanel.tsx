"use client";

import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { Button, Spinner } from "@conductor/ui";
import { IconAlertTriangle, IconExternalLink } from "@tabler/icons-react";
import { Streamdown } from "streamdown";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";

type Overview = FunctionReturnType<typeof api.github.getPullRequestOverview>;

type OverviewLoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; overview: Overview };

export function ReviewOverviewPanel({
  repoId,
  prNumber,
}: {
  repoId: Id<"githubRepos">;
  prNumber: number;
}) {
  const getOverview = useAction(api.github.getPullRequestOverview);
  const [state, setState] = useState<OverviewLoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    getOverview({ repoId, prNumber })
      .then((overview) => {
        if (!cancelled) setState({ status: "ready", overview });
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: error.message || "Couldn't load pull request",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [repoId, prNumber, getOverview, reloadKey]);

  if (state.status === "loading") {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="sm" />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <IconAlertTriangle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-destructive">{state.message}</p>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setReloadKey((k) => k + 1)}
        >
          Retry
        </Button>
      </div>
    );
  }

  const { overview } = state;

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <header className="space-y-2 border-b border-border pb-4">
          <div className="flex flex-wrap items-start gap-2">
            <h1 className="min-w-0 flex-1 text-xl font-semibold tracking-tight">
              {overview.title}{" "}
              <span className="font-normal text-muted-foreground">
                #{overview.number}
              </span>
            </h1>
            <a
              href={overview.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              View on GitHub
              <IconExternalLink size={12} />
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span
              className={
                overview.state === "open"
                  ? "rounded-md border border-border bg-emerald-500/10 px-1.5 py-0.5 text-emerald-700 dark:text-emerald-300"
                  : "rounded-md border border-border px-1.5 py-0.5"
              }
            >
              {overview.draft ? "Draft · " : ""}
              {overview.state}
            </span>
            {overview.authorLogin ? <span>{overview.authorLogin}</span> : null}
            <span>
              updated{" "}
              <RelativeDateTime at={new Date(overview.updatedAt).getTime()} />
            </span>
          </div>
        </header>

        <section className="space-y-2">
          <h2 className="text-sm font-medium text-foreground">Description</h2>
          {overview.body ? (
            <div className="rounded-lg border border-border bg-card p-4">
              <Streamdown className="prose prose-sm dark:prose-invert max-w-none text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                {overview.body}
              </Streamdown>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No description.</p>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-foreground">
              Conversation
            </h2>
            {overview.commentsTruncated ? (
              <span className="text-xs text-muted-foreground">
                Showing latest page of comments
              </span>
            ) : null}
          </div>
          {overview.comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          ) : (
            <ul className="space-y-3">
              {overview.comments.map((comment) => (
                <li
                  key={`${comment.kind}-${comment.id}`}
                  className="rounded-lg border border-border bg-card p-3"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {comment.authorAvatarUrl ? (
                      <img
                        src={comment.authorAvatarUrl}
                        alt=""
                        className="size-5 rounded-full"
                      />
                    ) : null}
                    <span className="font-medium text-foreground">
                      {comment.authorLogin ?? "unknown"}
                    </span>
                    <span className="rounded border border-border px-1 py-0.5">
                      {comment.kind === "review" ? "review" : "comment"}
                    </span>
                    {comment.path ? (
                      <span className="truncate font-mono">
                        {comment.path}
                        {comment.line !== undefined && comment.line !== null
                          ? `:${comment.line}`
                          : ""}
                      </span>
                    ) : null}
                    <span className="ml-auto">
                      <RelativeDateTime
                        at={new Date(comment.createdAt).getTime()}
                      />
                    </span>
                    <a
                      href={comment.htmlUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 hover:text-foreground"
                    >
                      <IconExternalLink size={12} />
                    </a>
                  </div>
                  <Streamdown className="prose prose-sm dark:prose-invert max-w-none text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    {comment.body}
                  </Streamdown>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
