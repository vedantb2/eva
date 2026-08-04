"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAction } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@eva/backend";
import { Spinner } from "@eva/ui";
import { IconExternalLink } from "@tabler/icons-react";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PendingReviewCommentsProvider } from "@/lib/contexts/PendingReviewCommentsContext";
import { githubPrUrl } from "@/lib/githubPr";
import { loadPrHeader, peekPrHeader } from "@/lib/prReviewCache";
import { REVIEW_DEFAULT_TAB, isReviewTab } from "@/lib/search-params";
import { EntityNotFound } from "@/lib/components/EntityNotFound";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import { ReviewTabsPanel } from "./ReviewTabsPanel";

type PrHeader = FunctionReturnType<typeof api.github.getPullRequestHeader>;

type HeaderLoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; header: PrHeader };

/**
 * Standalone Reviews page for one pull request. Owns the PR title block and the
 * `$reviewTab` path param; the tabs come from `ReviewTabsPanel`, shared with the
 * sandbox Review tab.
 */
export function ReviewDetailClient({
  prNumberParam,
  reviewTabParam,
}: {
  prNumberParam: string;
  reviewTabParam: string;
}) {
  const navigate = useNavigate();
  const { basePath, repoId, owner, name } = useRepo();
  const prNumber = Number(prNumberParam);
  const isValidPrNumber = Number.isFinite(prNumber) && prNumber > 0;
  const tab = isReviewTab(reviewTabParam) ? reviewTabParam : REVIEW_DEFAULT_TAB;

  const prUrl = isValidPrNumber
    ? githubPrUrl(owner, name, prNumber)
    : undefined;

  const getHeader = useAction(api.github.getPullRequestHeader);
  // Seeded from the SWR cache so a warmed or revisited PR shows its title on the
  // first paint instead of a spinner.
  const [headerState, setHeaderState] = useState<HeaderLoadState>(() => {
    if (!isValidPrNumber) return { status: "loading" };
    const cached = peekPrHeader({ repoId, prNumber });
    return cached === undefined
      ? { status: "loading" }
      : { status: "ready", header: cached.value };
  });

  useEffect(() => {
    if (!isValidPrNumber) return;
    let cancelled = false;
    const key = { repoId, prNumber };
    const cached = peekPrHeader(key);
    if (cached === undefined) {
      setHeaderState({ status: "loading" });
    } else {
      setHeaderState({ status: "ready", header: cached.value });
      if (!cached.stale) return;
    }
    loadPrHeader(getHeader, key)
      .then((header) => {
        if (!cancelled) setHeaderState({ status: "ready", header });
      })
      .catch((error: Error) => {
        // A failed revalidate keeps the title already on screen.
        if (cancelled || cached !== undefined) return;
        setHeaderState({
          status: "error",
          message: error.message || "Couldn't load pull request",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [repoId, prNumber, getHeader, isValidPrNumber]);

  const goToTab = (nextTab: string) => {
    void navigate({
      to: `${basePath}/reviews/${prNumber}/${nextTab}`,
      search: (prev) => prev,
    });
  };

  if (!isValidPrNumber) {
    return (
      <EntityNotFound
        entityLabel="pull request"
        backTo={`${basePath}/reviews`}
      />
    );
  }

  const header = (
    <div className="shrink-0 space-y-2 px-3 pt-3">
      {headerState.status === "loading" ? (
        <div className="flex h-10 items-center">
          <Spinner size="sm" />
        </div>
      ) : headerState.status === "error" ? (
        <p className="text-sm text-destructive">{headerState.message}</p>
      ) : (
        <>
          <div className="flex flex-wrap items-start gap-2">
            <h1 className="min-w-0 flex-1 text-lg font-semibold tracking-tight">
              {headerState.header.title}{" "}
              <span className="font-normal text-muted-foreground">
                #{headerState.header.number}
              </span>
            </h1>
            <a
              href={headerState.header.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              View on GitHub
              <IconExternalLink size={12} />
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {headerState.header.authorLogin ? (
              <span>{headerState.header.authorLogin}</span>
            ) : null}
            <span>
              updated{" "}
              <RelativeDateTime
                at={new Date(headerState.header.updatedAt).getTime()}
              />
            </span>
          </div>
        </>
      )}
    </div>
  );

  return (
    // Wraps the whole page (not just Diffs) so drafted comments survive a tab
    // switch. In the sandbox this provider is hoisted higher still, because the
    // chat composer reads the same pending comments.
    <PendingReviewCommentsProvider onOpenDiffsTab={() => goToTab("diffs")}>
      <ReviewTabsPanel
        repoId={repoId}
        prUrl={prUrl}
        prNumber={prNumber}
        activeTab={tab}
        onTabChange={goToTab}
        header={header}
      />
    </PendingReviewCommentsProvider>
  );
}
