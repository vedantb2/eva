"use client";

import { useNavigate, useRouterState, useSearch } from "@tanstack/react-router";
import { isPrPanelTab, type PrPanelTab } from "@/lib/search-params";

/** Matches `/review/diffs…` or `/review/recap` (with optional trailing slash / view). */
const REVIEW_DIFFS_PATH = /\/review\/diffs(?:\/(?:unified|split))?\/?$/;
const REVIEW_RECAP_PATH = /\/review\/recap\/?$/;

function prTabFromPathname(pathname: string): PrPanelTab | undefined {
  if (REVIEW_DIFFS_PATH.test(pathname)) return "diffs";
  if (REVIEW_RECAP_PATH.test(pathname)) return "recap";
  return undefined;
}

/**
 * Review panel Diffs/Recap sub-tab. Prefers path segments
 * (`…/review/diffs/…`, `…/review/recap`) and falls back to `?prTab=`.
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
      const reviewBase = pathname.replace(/\/review\/.*$/, "/review");
      const viewMatch = pathname.match(/\/review\/diffs\/(unified|split)/);
      const view = viewMatch?.[1] ?? "unified";
      const nextPath =
        tab === "diffs" ? `${reviewBase}/diffs/${view}` : `${reviewBase}/recap`;
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
