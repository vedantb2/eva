"use client";

import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useAction } from "convex/react";
import { api } from "@eva/backend";
import { Spinner } from "@eva/ui";
import { IconExternalLink } from "@tabler/icons-react";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PendingReviewCommentsProvider } from "@/lib/contexts/PendingReviewCommentsContext";
import { githubPrUrl } from "@/lib/githubPr";
import { prErrorMessage, prHeaderQuery } from "@/lib/prReviewQueries";
import { REVIEW_DEFAULT_TAB, isReviewTab } from "@/lib/search-params";
import { EntityNotFound } from "@/lib/components/EntityNotFound";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import { ReviewTabsPanel } from "./ReviewTabsPanel";

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
      {prHeader !== undefined ? (
        <>
          <div className="flex flex-wrap items-start gap-2">
            <h1 className="min-w-0 flex-1 text-lg font-semibold tracking-tight">
              {prHeader.title}{" "}
              <span className="font-normal text-muted-foreground">
                #{prHeader.number}
              </span>
            </h1>
            <a
              href={prHeader.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              View on GitHub
              <IconExternalLink size={12} />
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {prHeader.authorLogin ? <span>{prHeader.authorLogin}</span> : null}
            <span>
              updated{" "}
              <RelativeDateTime
                at={new Date(prHeader.updatedAt).getTime()}
              />
            </span>
          </div>
        </>
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
      />
    </PendingReviewCommentsProvider>
  );
}
