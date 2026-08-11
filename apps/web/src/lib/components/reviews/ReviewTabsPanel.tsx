"use client";

import type { ReactNode } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api, type Id } from "@eva/backend";
import { Tabs, TabsBar, TabsContent, TabsList, TabsTrigger, cn } from "@eva/ui";
import { WorkerPoolContextProvider } from "@pierre/diffs/react";
import { IconGitPullRequest } from "@tabler/icons-react";
import { isReviewTab, type ReviewTab } from "@/lib/search-params";
import { DiffsPanel } from "@/lib/components/sandbox/DiffsPanel";
import {
  DIFF_HIGHLIGHTER_OPTIONS,
  DIFF_POOL_OPTIONS,
} from "@/lib/components/sandbox/diffWorkerPool";
import { PrRecapPanel } from "@/lib/components/sandbox/PrRecapPanel";
import { ReviewOverviewPanel } from "./ReviewOverviewPanel";
import { usePrOverview } from "./usePrOverview";
import { PrChecksPill } from "./_components/PrChecksPill";
import { ReviewHeader } from "./_components/ReviewHeader";

interface ReviewTabsPanelProps {
  repoId: Id<"githubRepos">;
  /** Absent until a pull request exists for the work being reviewed. */
  prUrl?: string;
  prNumber?: number;
  activeTab: ReviewTab;
  onTabChange: (tab: ReviewTab) => void;
  /**
   * Rendered as the first row of the shared header — the standalone page puts the
   * PR title here. Padding is supplied here, so pass an unwrapped block.
   */
  header?: ReactNode;
  /**
   * True where `header` already carries a Refresh control, so the shared header
   * drops its own rather than showing two.
   */
  headerOwnsRefresh?: boolean;
  /**
   * Nested surfaces (session sandbox Review) use `size="sm"` on the same
   * TabsBar / TabsList; the standalone Reviews page keeps the default size.
   */
  compact?: boolean;
}

/**
 * The Overview/Diffs/Recap tab set, shared by the standalone Reviews page and
 * the sandbox Review tab. Every review surface renders this, so tab order,
 * labels, slugs, empty states, and panel wiring cannot drift between them: the
 * only per-surface concerns are how the active tab is read from the URL and
 * what (if anything) sits above the tab row.
 *
 * Deliberately does not mount `PendingReviewCommentsProvider`: the sandbox
 * shares those pending comments with its chat composer, so the provider has to
 * live above this component, on the surface that owns both.
 */
export function ReviewTabsPanel({
  repoId,
  prUrl,
  prNumber,
  activeTab,
  onTabChange,
  header,
  headerOwnsRefresh = false,
  compact = false,
}: ReviewTabsPanelProps) {
  // Cached hook, so querying here as well as on a surface that needs the recap
  // to pick a default tab costs one request, not two.
  const recapDoc = useQuery(
    api.docs.getRecapByPrUrl,
    prUrl ? { repoId, prUrl } : "skip",
  );
  // Read here rather than inside Overview: the header above the tab row and the
  // Overview tab are two views of one payload, and the header has to stay true
  // while the reader is in Diffs or Recap.
  const { state, reload } = usePrOverview(repoId, prNumber);
  const overview = state.status === "ready" ? state.overview : null;
  const tabSize = compact ? "sm" : "default";

  return (
    // Mounted unconditionally and above the tabs, so the workers spin up while
    // the surface is still hidden rather than on the click that reveals Diffs.
    // The pool itself is a refcounted singleton, so several review surfaces
    // share one set of workers and the last to unmount tears them down.
    <WorkerPoolContextProvider
      poolOptions={DIFF_POOL_OPTIONS}
      highlighterOptions={DIFF_HIGHLIGHTER_OPTIONS}
    >
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          if (isReviewTab(value)) onTabChange(value);
        }}
        className="flex h-full min-h-0 flex-col"
      >
        {/* Until the overview lands, the surface's own block stands in for the
            header — same padding, so the title does not shift when it arrives. */}
        {overview === null ? (
          header === undefined ? null : (
            <div className="shrink-0 px-3 pt-3">{header}</div>
          )
        ) : (
          <ReviewHeader
            overview={overview}
            refreshing={state.status === "ready" && state.refreshing}
            onRefresh={headerOwnsRefresh ? undefined : reload}
            title={header}
          />
        )}
        <TabsBar
          size={tabSize}
          actions={
            overview === null ? null : (
              <PrChecksPill
                checks={overview.checks}
                onSelect={() => onTabChange("overview")}
              />
            )
          }
        >
          <TabsList
            size={tabSize}
            className="tabs-line h-auto gap-0.5 shadow-none"
          >
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="diffs">Diffs</TabsTrigger>
            <TabsTrigger value="recap">Recap</TabsTrigger>
          </TabsList>
        </TabsBar>

        {/* forceMount + hidden: switching tabs keeps each panel's state (drafted
            comments, scroll position, expanded files) instead of refetching. */}
        <ReviewTabContent tab="overview" activeTab={activeTab}>
          {prNumber === undefined ? (
            <NoPullRequest detail="Once a pull request is opened for this work, its overview will appear here." />
          ) : (
            <ReviewOverviewPanel
              repoId={repoId}
              prNumber={prNumber}
              state={state}
              reload={reload}
            />
          )}
        </ReviewTabContent>

        <ReviewTabContent tab="diffs" activeTab={activeTab}>
          <DiffsPanel prUrl={prUrl} repoId={repoId} />
        </ReviewTabContent>

        <ReviewTabContent tab="recap" activeTab={activeTab}>
          <PrRecapPanel prUrl={prUrl} repoId={repoId} recapDoc={recapDoc} />
        </ReviewTabContent>
      </Tabs>
    </WorkerPoolContextProvider>
  );
}

function ReviewTabContent({
  tab,
  activeTab,
  children,
}: {
  tab: ReviewTab;
  activeTab: ReviewTab;
  children: ReactNode;
}) {
  return (
    <TabsContent
      value={tab}
      forceMount
      className={cn(
        "mt-0 min-h-0 flex-1 focus-visible:ring-0",
        activeTab !== tab && "hidden",
      )}
    >
      {children}
    </TabsContent>
  );
}

function NoPullRequest({ detail }: { detail: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <IconGitPullRequest className="h-10 w-10 text-muted-foreground/60" />
      <div className="max-w-md space-y-1">
        <p className="text-sm font-medium">No pull request yet</p>
        <p className="text-sm text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}
