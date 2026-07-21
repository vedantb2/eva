"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api, type Id } from "@conductor/backend";
import { cn } from "@conductor/ui";
import type { PrPanelTab } from "@/lib/search-params";
import { DiffsPanel } from "./DiffsPanel";
import { PrRecapPanel } from "./PrRecapPanel";
import { usePrTabParam } from "./usePrTabParam";

interface PrPanelProps {
  prUrl?: string;
  repoId: Id<"githubRepos">;
  isActive: boolean;
}

/**
 * Sandbox PR tab: Diffs + Recap sub-tabs. Defaults to Recap when a ready recap
 * exists (resolved once on first activation so mid-generation doesn't jump).
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
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-1.5">
        <div className="inline-flex rounded-md border border-border p-0.5">
          {(
            [
              { value: "diffs", label: "Diffs" },
              { value: "recap", label: "Recap" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setPrTab(tab.value);
              }}
              className={cn(
                "rounded px-2 py-0.5 text-xs font-medium transition-colors",
                activeSubTab === tab.value
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <div className={activeSubTab === "diffs" ? "h-full" : "hidden"}>
          <DiffsPanel prUrl={prUrl} repoId={repoId} />
        </div>
        <div className={activeSubTab === "recap" ? "h-full" : "hidden"}>
          <PrRecapPanel prUrl={prUrl} repoId={repoId} recapDoc={recapDoc} />
        </div>
      </div>
    </div>
  );
}
