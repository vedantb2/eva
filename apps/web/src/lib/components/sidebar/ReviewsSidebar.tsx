"use client";

import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import { Button, Spinner } from "@eva/ui";
import { IconGitPullRequest } from "@tabler/icons-react";
import { useQueryState } from "nuqs";
import { prefetchPrReview } from "@/lib/prReviewCache";
import { pullRequestListStateParser } from "@/lib/search-params";
import { ReviewsListStateTabs } from "@/lib/components/sidebar/_components/ReviewsListStateTabs";
import { ReviewsSidebarRow } from "@/lib/components/sidebar/_components/ReviewsSidebarRow";
import { SharedLayoutNav } from "@/lib/components/sidebar/SharedLayoutNav";

interface ReviewsSidebarProps {
  repoId: Id<"githubRepos">;
  basePath: string;
  pathname: string;
  onNavigate?: () => void;
}

type PullRequestListItem = {
  number: number;
  title: string;
  state: "open" | "closed";
  draft: boolean;
  authorLogin: string | null;
  updatedAt: string;
  createdAt: string;
  htmlUrl: string;
};

type ListState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; pulls: PullRequestListItem[] };

/**
 * Context sidebar listing GitHub PRs for the codebase. Selection opens
 * /reviews/$prNumber/overview (and sibling tabs).
 */
export function ReviewsSidebar({
  repoId,
  basePath,
  pathname,
  onNavigate,
}: ReviewsSidebarProps) {
  const listPullRequests = useAction(api.github.listPullRequests);
  // Bound once here so the row only needs a `() => void` — the cache module
  // stays free of any dependency on the Convex client.
  const runners = {
    diff: useAction(api.github.getPrDiff),
    overview: useAction(api.github.getPullRequestOverview),
    header: useAction(api.github.getPullRequestHeader),
  };
  const [listState, setListState] = useQueryState(
    "prState",
    pullRequestListStateParser,
  );
  const [state, setState] = useState<ListState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    listPullRequests({ repoId, state: listState })
      .then((pulls) => {
        if (!cancelled) setState({ status: "ready", pulls });
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: error.message || "Couldn't load pull requests",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [repoId, listState, listPullRequests, reloadKey]);

  const activePrNumber = (() => {
    const match = pathname.match(/\/reviews\/(\d+)(?:\/|$)/);
    if (!match) return null;
    const n = Number(match[1]);
    return Number.isFinite(n) ? n : null;
  })();

  const pulls = state.status === "ready" ? state.pulls : [];

  return (
    <>
      <div className="px-2 py-2">
        <ReviewsListStateTabs
          state={listState}
          onChange={(next) => {
            void setListState(next);
          }}
        />
      </div>

      <div className="flex-1">
        {state.status === "loading" ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="sm" />
          </div>
        ) : state.status === "error" ? (
          <div className="space-y-2 p-4 text-center">
            <p className="text-sm text-destructive">{state.message}</p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setReloadKey((k) => k + 1)}
            >
              Retry
            </Button>
          </div>
        ) : pulls.length === 0 ? (
          <div className="p-4 text-center">
            <IconGitPullRequest
              size={28}
              className="mx-auto mb-2 text-muted-foreground"
            />
            <p className="text-sm text-muted-foreground">
              No {listState === "all" ? "" : `${listState} `}pull requests
            </p>
          </div>
        ) : (
          <SharedLayoutNav layoutId="reviews-sidebar-nav" className="px-2 pb-2">
            {pulls.map((pr) => (
              <ReviewsSidebarRow
                key={pr.number}
                pr={pr}
                href={`${basePath}/reviews/${pr.number}/overview`}
                isActive={activePrNumber === pr.number}
                onNavigate={onNavigate}
                onPrefetch={() =>
                  prefetchPrReview(runners, { repoId, prNumber: pr.number })
                }
              />
            ))}
          </SharedLayoutNav>
        )}
      </div>
    </>
  );
}
