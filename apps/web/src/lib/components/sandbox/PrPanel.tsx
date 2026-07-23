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
import { IconRefresh } from "@tabler/icons-react";
import { isDiffView, isPrPanelTab, type PrPanelTab } from "@/lib/search-params";
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
 * Sandbox Review tab: Diffs + Recap via `@conductor/ui` Tabs. Path segments
 * (`…/review/diffs/…`, `…/review/recap`) are preferred; `?prTab=` remains a
 * redirect/fallback.
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
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-1.5">
        <TabsList className="h-8">
          <TabsTrigger value="diffs" className="px-2.5 py-1 text-xs">
            Diffs
          </TabsTrigger>
          <TabsTrigger value="recap" className="px-2.5 py-1 text-xs">
            Recap
          </TabsTrigger>
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
