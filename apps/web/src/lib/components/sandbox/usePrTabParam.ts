"use client";

import { useNavigate, useSearch } from "@tanstack/react-router";
import { isPrPanelTab, type PrPanelTab } from "@/lib/search-params";

/**
 * PR panel Diffs/Recap sub-tab via TanStack search params (not nuqs — same
 * corruption rationale as `useDiffSearchParams`).
 */
export function usePrTabParam() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false });

  const prTabValue = "prTab" in search ? search.prTab : undefined;
  const prTab: PrPanelTab | undefined =
    typeof prTabValue === "string" && isPrPanelTab(prTabValue)
      ? prTabValue
      : undefined;

  const setPrTab = (tab: PrPanelTab) => {
    void navigate({
      to: ".",
      search: (prev) => ({ ...prev, prTab: tab }),
      replace: true,
    });
  };

  return { prTab, setPrTab };
}
