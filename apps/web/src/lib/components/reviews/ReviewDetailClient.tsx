"use client";

import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import { Spinner, Tabs, TabsList, TabsTrigger } from "@conductor/ui";
import { useRepo } from "@/lib/contexts/RepoContext";
import { githubPrUrl } from "@/lib/githubPr";
import {
  REVIEW_DEFAULT_TAB,
  isReviewTab,
  type ReviewTab,
} from "@/lib/search-params";
import { DiffsPanel } from "@/lib/components/sandbox/DiffsPanel";
import { PrRecapPanel } from "@/lib/components/sandbox/PrRecapPanel";
import { EntityNotFound } from "@/lib/components/EntityNotFound";
import { ReviewOverviewPanel } from "./ReviewOverviewPanel";

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
  const tab: ReviewTab = isReviewTab(reviewTabParam)
    ? reviewTabParam
    : REVIEW_DEFAULT_TAB;

  const prUrl = isValidPrNumber
    ? githubPrUrl(owner, name, prNumber)
    : undefined;
  const recapDoc = useQuery(
    api.docs.getRecapByPrUrl,
    prUrl ? { repoId, prUrl } : "skip",
  );

  if (!isValidPrNumber) {
    return (
      <EntityNotFound
        entityLabel="pull request"
        backTo={`${basePath}/reviews`}
      />
    );
  }

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => {
        if (!isReviewTab(value)) return;
        void navigate({
          to: `${basePath}/reviews/${prNumber}/${value}`,
          search: (prev) => prev,
        });
      }}
      className="flex h-full min-h-0 flex-col"
    >
      <div className="flex shrink-0 items-center border-b border-border px-3 py-1.5">
        <TabsList className="h-8">
          <TabsTrigger value="overview" className="px-2.5 py-1 text-xs">
            Overview
          </TabsTrigger>
          <TabsTrigger value="recap" className="px-2.5 py-1 text-xs">
            Recap
          </TabsTrigger>
          <TabsTrigger value="diff" className="px-2.5 py-1 text-xs">
            Diff
          </TabsTrigger>
        </TabsList>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {tab === "overview" ? (
          <ReviewOverviewPanel repoId={repoId} prNumber={prNumber} />
        ) : null}
        {tab === "recap" ? (
          recapDoc === undefined || prUrl === undefined ? (
            <div className="flex h-full items-center justify-center">
              <Spinner size="sm" />
            </div>
          ) : (
            <PrRecapPanel prUrl={prUrl} repoId={repoId} recapDoc={recapDoc} />
          )
        ) : null}
        {tab === "diff" && prUrl !== undefined ? (
          <DiffsPanel prUrl={prUrl} repoId={repoId} />
        ) : null}
      </div>
    </Tabs>
  );
}
