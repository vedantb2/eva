"use client";

import { useNavigate, useRouterState, useSearch } from "@tanstack/react-router";
import { isPrPanelTab, type PrPanelTab } from "@/lib/search-params";

/** Matches `/pr/diffs…` or `/pr/recap` (with optional trailing slash / view). */
const PR_DIFFS_PATH = /\/pr\/diffs(?:\/(?:unified|split))?\/?$/;
const PR_RECAP_PATH = /\/pr\/recap\/?$/;

function prTabFromPathname(pathname: string): PrPanelTab | undefined {
  if (PR_DIFFS_PATH.test(pathname)) return "diffs";
  if (PR_RECAP_PATH.test(pathname)) return "recap";
  return undefined;
}

/**
 * PR panel Diffs/Recap sub-tab. Prefers path segments
 * (`…/pr/diffs/…`, `…/pr/recap`) and falls back to `?prTab=`.
 */
export function usePrTabParam() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useSearch({ strict: false });

  const pathTab = prTabFromPathname(pathname);

  const searchTabValue = "prTab" in search ? search.prTab : undefined;
  const searchTab: PrPanelTab | undefined =
    typeof searchTabValue === "string" && isPrPanelTab(searchTabValue)
      ? searchTabValue
      : undefined;

  const prTab = pathTab ?? searchTab;

  const setPrTab = (tab: PrPanelTab) => {
    if (pathTab !== undefined) {
      const prBase = pathname.replace(/\/pr\/.*$/, "/pr");
      const viewMatch = pathname.match(/\/pr\/diffs\/(unified|split)/);
      const view = viewMatch?.[1] ?? "unified";
      const nextPath =
        tab === "diffs" ? `${prBase}/diffs/${view}` : `${prBase}/recap`;
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
