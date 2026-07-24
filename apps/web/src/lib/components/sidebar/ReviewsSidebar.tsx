"use client";

import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import { Link } from "@tanstack/react-router";
import { Button, SearchInput, Spinner, cn } from "@eva/ui";
import { IconGitPullRequest } from "@tabler/icons-react";
import { useQueryState } from "nuqs";
import {
  pullRequestListStateParser,
  searchParser,
  type PullRequestListState,
} from "@/lib/search-params";
import {
  SharedLayoutNav,
  SharedLayoutNavSurface,
  sidebarNavLinkClass,
} from "@/lib/components/sidebar/SharedLayoutNav";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";

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
  const [searchQuery, setSearchQuery] = useQueryState("q", searchParser);
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

  const filteredPulls = (() => {
    if (state.status !== "ready") return [];
    const q = searchQuery.toLowerCase().trim();
    if (!q) return state.pulls;
    return state.pulls.filter((pr) => {
      const haystack = `${pr.number} ${pr.title} ${pr.authorLogin ?? ""}`;
      return haystack.toLowerCase().includes(q);
    });
  })();

  const stateButtons: Array<{ value: PullRequestListState; label: string }> = [
    { value: "open", label: "Open" },
    { value: "closed", label: "Closed" },
    { value: "all", label: "All" },
  ];

  return (
    <>
      <div className="flex items-center gap-1.5 p-2">
        <SearchInput
          placeholder="Search pull requests..."
          value={searchQuery}
          onChange={(v) => setSearchQuery(v || null)}
          onClear={() => setSearchQuery(null)}
          className="min-w-0 flex-1"
          inputClassName="border-sidebar-border/80 bg-sidebar/70 text-sidebar-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex gap-1 px-2 pb-2">
        {stateButtons.map((btn) => (
          <Button
            key={btn.value}
            size="sm"
            variant={listState === btn.value ? "secondary" : "ghost"}
            className="h-7 flex-1 px-2 text-xs"
            onClick={() => setListState(btn.value)}
          >
            {btn.label}
          </Button>
        ))}
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
        ) : state.pulls.length === 0 ? (
          <div className="p-4 text-center">
            <IconGitPullRequest
              size={28}
              className="mx-auto mb-2 text-muted-foreground"
            />
            <p className="text-sm text-muted-foreground">
              No {listState === "all" ? "" : `${listState} `}pull requests
            </p>
          </div>
        ) : filteredPulls.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No matches found
          </div>
        ) : (
          <SharedLayoutNav layoutId="reviews-sidebar-nav" className="px-2 pb-2">
            {filteredPulls.map((pr) => {
              const href = `${basePath}/reviews/${pr.number}/overview`;
              const isActive = activePrNumber === pr.number;
              return (
                <SharedLayoutNavSurface
                  key={pr.number}
                  itemId={String(pr.number)}
                  isActive={isActive}
                >
                  <Link
                    to={href}
                    onClick={() => onNavigate?.()}
                    className={cn(
                      sidebarNavLinkClass(isActive),
                      "flex-col items-start gap-0.5 py-2.5",
                    )}
                  >
                    <span className="flex w-full min-w-0 items-center gap-1.5">
                      <IconGitPullRequest
                        size={14}
                        className={cn(
                          "shrink-0",
                          pr.draft || pr.state !== "open"
                            ? "text-muted-foreground"
                            : "text-emerald-600 dark:text-emerald-400",
                        )}
                      />
                      <span className="truncate text-sm font-medium">
                        {pr.title}
                      </span>
                    </span>
                    <span className="flex w-full min-w-0 items-center gap-1.5 pl-5 text-[11px] text-muted-foreground">
                      <span className="shrink-0">#{pr.number}</span>
                      {pr.authorLogin ? (
                        <span className="truncate">{pr.authorLogin}</span>
                      ) : null}
                      <span className="ml-auto shrink-0">
                        <RelativeDateTime
                          at={new Date(pr.updatedAt).getTime()}
                        />
                      </span>
                    </span>
                  </Link>
                </SharedLayoutNavSurface>
              );
            })}
          </SharedLayoutNav>
        )}
      </div>
    </>
  );
}
