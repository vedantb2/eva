"use client";

import { useState } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api, type Id } from "@conductor/backend";
import {
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  cn,
} from "@conductor/ui";
import { IconGitPullRequest, IconRefresh } from "@tabler/icons-react";
import { isDiffView, isPrPanelTab, type PrPanelTab } from "@/lib/search-params";
import { prNumberFromGithubUrl } from "@/lib/githubPr";
import { ReviewOverviewPanel } from "@/lib/components/reviews/ReviewOverviewPanel";
import { DiffsPanel } from "./DiffsPanel";
import { PrRecapPanel } from "./PrRecapPanel";
import { useDiffSearchParams } from "./useDiffSearchParams";
import { usePrTabParam } from "./usePrTabParam";

interface PrPanelProps {
  prUrl?: string;
  repoId: Id<"githubRepos">;
  isActive: boolean;
}

interface DiffToolbarState {
  isLoading: boolean;
  refresh: () => void;
}

/**
 * Sandbox Review tab: Overview + Diffs + Recap via `@conductor/ui` Tabs. Path
 * segments (`…/review/overview`, `…/review/diffs/…`, `…/review/recap`) are
 * preferred; `?prTab=` remains a redirect/fallback.
 * Defaults to Recap when a ready recap exists and no tab is in the URL yet.
 * Unified/Split + Refresh sit on the same header row and only show for Diffs.
 */
export function PrPanel({ prUrl, repoId, isActive }: PrPanelProps) {
  const { prTab, setPrTab } = usePrTabParam();
  const { diffView, setDiffView } = useDiffSearchParams();
  const recapDoc = useQuery(
    api.docs.getRecapByPrUrl,
    prUrl ? { repoId, prUrl } : "skip",
  );
  const [resolvedDefault, setResolvedDefault] = useState<PrPanelTab | null>(
    null,
  );
  const [diffToolbar, setDiffToolbar] = useState<DiffToolbarState | null>(null);
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
  const showDiffChrome = activeSubTab === "diffs" && prUrl !== undefined;

  return (
    <Tabs
      value={activeSubTab}
      onValueChange={(value) => {
        if (isPrPanelTab(value)) setPrTab(value);
      }}
      className="flex h-full min-h-0 flex-col"
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="diffs">Diffs</TabsTrigger>
          <TabsTrigger value="recap">Recap</TabsTrigger>
        </TabsList>
        {showDiffChrome ? (
          <div className="ml-auto flex items-center gap-2">
            <Tabs
              value={diffView}
              onValueChange={(value) => {
                if (isDiffView(value)) setDiffView(value);
              }}
            >
              <TabsList className="h-8">
                <TabsTrigger value="unified" className="px-2.5 py-1 text-xs">
                  Unified
                </TabsTrigger>
                <TabsTrigger value="split" className="px-2.5 py-1 text-xs">
                  Split
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => diffToolbar?.refresh()}
              disabled={diffToolbar === null || diffToolbar.isLoading}
            >
              <IconRefresh
                className={cn(
                  "h-3.5 w-3.5",
                  diffToolbar?.isLoading === true && "animate-spin",
                )}
              />
              Refresh
            </Button>
          </div>
        ) : null}
      </div>
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
        <DiffsPanel
          prUrl={prUrl}
          repoId={repoId}
          onToolbarStateChange={setDiffToolbar}
        />
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
