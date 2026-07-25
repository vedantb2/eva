"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAction } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import type { FunctionReturnType } from "convex/server";
import { api } from "@eva/backend";
import { Spinner, Tabs, TabsList, TabsTrigger } from "@eva/ui";
import {
  IconExternalLink,
  IconFileDiff,
  IconFileText,
  IconLayoutDashboard,
} from "@tabler/icons-react";
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
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import { ReviewOverviewPanel } from "./ReviewOverviewPanel";

type PrHeader = FunctionReturnType<typeof api.github.getPullRequestHeader>;

type HeaderLoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; header: PrHeader };

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

  const getHeader = useAction(api.github.getPullRequestHeader);
  const [headerState, setHeaderState] = useState<HeaderLoadState>({
    status: "loading",
  });

  useEffect(() => {
    if (!isValidPrNumber) return;
    let cancelled = false;
    setHeaderState({ status: "loading" });
    getHeader({ repoId, prNumber })
      .then((header) => {
        if (!cancelled) setHeaderState({ status: "ready", header });
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setHeaderState({
            status: "error",
            message: error.message || "Couldn't load pull request",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [repoId, prNumber, getHeader, isValidPrNumber]);

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
      <div className="shrink-0 space-y-2 border-b border-border px-3 py-3">
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
        <TabsList>
          <TabsTrigger value="overview" className="gap-1.5">
            <IconLayoutDashboard className="size-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="recap" className="gap-1.5">
            <IconFileText className="size-4" />
            Recap
          </TabsTrigger>
          <TabsTrigger value="diff" className="gap-1.5">
            <IconFileDiff className="size-4" />
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
