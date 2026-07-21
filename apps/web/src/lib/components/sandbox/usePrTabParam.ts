"use client";

import { useNavigate, useRouterState, useSearch } from "@tanstack/react-router";
import { isPrPanelTab, type PrPanelTab } from "@/lib/search-params";

const PR_SUB_TAB_PATH = /\/pr\/(diffs|recap)\/?$/;

/**
 * PR panel Diffs/Recap sub-tab. Prefers path segments (`…/pr/diffs`) and falls
 * back to `?prTab=` for surfaces that have not migrated yet.
 */
export function usePrTabParam() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useSearch({ strict: false });

  const pathMatch = pathname.match(PR_SUB_TAB_PATH);
  const pathTab: PrPanelTab | undefined =
    pathMatch !== null && isPrPanelTab(pathMatch[1]) ? pathMatch[1] : undefined;

  const searchTabValue = "prTab" in search ? search.prTab : undefined;
  const searchTab: PrPanelTab | undefined =
    typeof searchTabValue === "string" && isPrPanelTab(searchTabValue)
      ? searchTabValue
      : undefined;

  const prTab = pathTab ?? searchTab;

  const setPrTab = (tab: PrPanelTab) => {
    if (pathMatch !== null) {
      const nextPath = pathname.replace(PR_SUB_TAB_PATH, `/pr/${tab}`);
      if (nextPath === pathname) return;
      void navigate({
        to: nextPath,
        search: true,
        replace: true,
      });
      return;
    }
    void navigate({
      to: ".",
      search: (prev) => ({ ...prev, prTab: tab }),
      replace: true,
    });
  };

  return { prTab, setPrTab };
}
