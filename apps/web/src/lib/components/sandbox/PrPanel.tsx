"use client";

import { useState } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api, type Id } from "@eva/backend";
import { Tabs, TabsBar, TabsContent, TabsList, TabsTrigger, cn } from "@eva/ui";
import { IconGitPullRequest } from "@tabler/icons-react";
import { isPrPanelTab, type PrPanelTab } from "@/lib/search-params";
import { prNumberFromGithubUrl } from "@/lib/githubPr";
import { ReviewOverviewPanel } from "@/lib/components/reviews/ReviewOverviewPanel";
import { DiffsPanel } from "./DiffsPanel";
import { PrRecapPanel } from "./PrRecapPanel";
import { usePrTabParam } from "./usePrTabParam";

interface PrPanelProps {
  prUrl?: string;
  repoId: Id<"githubRepos">;
  isActive: boolean;
}

/**
 * Sandbox Review tab: Overview + Diffs + Recap via `@eva/ui` Tabs. Path
 * segments (`…/review/overview`, `…/review/diffs/…`, `…/review/recap`) are
 * preferred; `?prTab=` remains a redirect/fallback.
 * Defaults to Recap when a ready recap exists and no tab is in the URL yet.
 * Diff chrome (layout, filter, Refresh) lives in DiffsPanel's own toolbar.
 */
export function PrPanel({ prUrl, repoId, isActive }: PrPanelProps) {
  const { prTab, setPrTab } = usePrTabParam();
  const recapDoc = useQuery(
    api.docs.getRecapByPrUrl,
    prUrl ? { repoId, prUrl } : "skip",
  );
  const [resolvedDefault, setResolvedDefault] = useState<PrPanelTab | null>(
    null,
  );
  const prNumber =
    prUrl !== undefined ? prNumberFromGithubUrl(prUrl) : undefined;

  // Resolve the default tab once recap query settles (adjust during render).
  if (isActive && resolvedDefault === null) {
    if (!prUrl) {
      setResolvedDefault("diffs");
    } else if (recapDoc !== undefined) {
      setResolvedDefault(
        recapDoc !== null && recapDoc.prRecapStatus === "ready"
          ? "recap"
          : "diffs",
      );
    }
  }

  const activeSubTab: PrPanelTab = prTab ?? resolvedDefault ?? "diffs";

  return (
    <Tabs
      value={activeSubTab}
      onValueChange={(value) => {
        if (isPrPanelTab(value)) setPrTab(value);
      }}
      className="flex h-full min-h-0 flex-col"
    >
      <TabsBar>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="diffs">Diffs</TabsTrigger>
          <TabsTrigger value="recap">Recap</TabsTrigger>
        </TabsList>
      </TabsBar>
      <TabsContent
        value="overview"
        forceMount
        className={cn(
          "mt-0 min-h-0 flex-1 focus-visible:ring-0",
          activeSubTab !== "overview" && "hidden",
        )}
      >
        {prNumber !== undefined ? (
          <ReviewOverviewPanel repoId={repoId} prNumber={prNumber} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <IconGitPullRequest className="h-10 w-10 text-muted-foreground/60" />
            <div className="max-w-md space-y-1">
              <p className="text-sm font-medium">No pull request yet</p>
              <p className="text-sm text-muted-foreground">
                Once a pull request is opened for this work, its overview will
                appear here.
              </p>
            </div>
          </div>
        )}
      </TabsContent>
      <TabsContent
        value="diffs"
        forceMount
        className={cn(
          "mt-0 min-h-0 flex-1 focus-visible:ring-0",
          activeSubTab !== "diffs" && "hidden",
        )}
      >
        <DiffsPanel prUrl={prUrl} repoId={repoId} />
      </TabsContent>
      <TabsContent
        value="recap"
        forceMount
        className={cn(
          "mt-0 min-h-0 flex-1 focus-visible:ring-0",
          activeSubTab !== "recap" && "hidden",
        )}
      >
        <PrRecapPanel prUrl={prUrl} repoId={repoId} recapDoc={recapDoc} />
      </TabsContent>
    </Tabs>
  );
}
