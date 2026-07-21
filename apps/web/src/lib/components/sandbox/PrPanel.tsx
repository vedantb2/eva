"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api, type Id } from "@conductor/backend";
import { Tabs, TabsContent, TabsList, TabsTrigger, cn } from "@conductor/ui";
import { isPrPanelTab, type PrPanelTab } from "@/lib/search-params";
import { DiffsPanel } from "./DiffsPanel";
import { PrRecapPanel } from "./PrRecapPanel";
import { usePrTabParam } from "./usePrTabParam";

interface PrPanelProps {
  prUrl?: string;
  repoId: Id<"githubRepos">;
  isActive: boolean;
}

/**
 * Sandbox PR tab: Diffs + Recap via `@conductor/ui` Tabs. Sessions use path
 * segments (`/review/diffs/…`, `/review/recap`); other surfaces may still use
 * `?prTab=`.
 * Defaults to Recap when a ready recap exists and no tab is in the URL yet.
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

  useEffect(() => {
    if (!isActive || resolvedDefault !== null) return;
    if (!prUrl) {
      setResolvedDefault("diffs");
      return;
    }
    if (recapDoc === undefined) return;
    setResolvedDefault(
      recapDoc !== null && recapDoc.prRecapStatus === "ready"
        ? "recap"
        : "diffs",
    );
  }, [isActive, prUrl, recapDoc, resolvedDefault]);

  const activeSubTab: PrPanelTab = prTab ?? resolvedDefault ?? "diffs";

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
      </div>
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
