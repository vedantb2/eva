"use client";

import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useAction } from "convex/react";
import { api } from "@eva/backend";
import { Button, Spinner } from "@eva/ui";
import { IconExternalLink, IconRefresh } from "@tabler/icons-react";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PendingReviewCommentsProvider } from "@/lib/contexts/PendingReviewCommentsContext";
import { githubPrUrl } from "@/lib/githubPr";
import { prErrorMessage, prHeaderQuery } from "@/lib/prReviewQueries";
import { REVIEW_DEFAULT_TAB, isReviewTab } from "@/lib/search-params";
import { EntityNotFound } from "@/lib/components/EntityNotFound";
import { ReviewTabsPanel } from "./ReviewTabsPanel";
import { usePrRefresh } from "./usePrOverview";
import { toInternalRepoHref } from "@/lib/utils/repoUrl";

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
  // Cached, so a warmed or revisited PR shows its title on the first paint
  // instead of a spinner. Rendering `data` ahead of `isError` also means a failed
  // revalidate keeps the title that is already on screen.
  const headerQuery = useQuery(
    prHeaderQuery(getHeader, repoId, isValidPrNumber ? prNumber : undefined),
  );
  const prHeader = headerQuery.data;
  // One Refresh for the page, renewing both the title block and Overview — the
  // tab drops its own control (`headerOwnsRefresh`) so there is only ever one.
  const { refresh, refreshing } = usePrRefresh(repoId, prNumber);

  const goToTab = (nextTab: string) => {
    // basePath is already the router's internal `--` form on main
    // (`repoHref`); staging's slash-URL rewrite is not in this slice.
    void navigate({
      to: toInternalRepoHref(`${basePath}/reviews/${prNumber}/${nextTab}`),
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
    <div className="shrink-0 px-3 pt-3">
      {prHeader !== undefined ? (
        // Author and last-updated live on the Overview tab's lifecycle line and
        // in the reviews list, so the page chrome carries the title and the two
        // controls that act on the whole pull request.
        <div className="flex flex-wrap items-start gap-2">
          <h1 className="min-w-0 flex-1 text-lg font-semibold tracking-tight">
            {prHeader.title}{" "}
            <span className="font-normal text-muted-foreground">
              #{prHeader.number}
            </span>
          </h1>
          <div className="flex shrink-0 items-center gap-1">
            <Button size="sm" variant="ghost" asChild>
              <a
                href={prHeader.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on GitHub
                <IconExternalLink size={14} aria-hidden />
              </a>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={refresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <Spinner size="sm" />
              ) : (
                <IconRefresh size={14} aria-hidden />
              )}
              Refresh
            </Button>
          </div>
        </div>
      ) : headerQuery.isError ? (
        <p className="text-sm text-destructive">
          {prErrorMessage(headerQuery.error, "Couldn't load pull request")}
        </p>
      ) : (
        <div className="flex h-10 items-center">
          <Spinner size="sm" />
        </div>
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
        headerOwnsRefresh
      />
    </PendingReviewCommentsProvider>
  );
}
