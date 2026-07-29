"use client";

import { useNavigate, useRouterState, useSearch } from "@tanstack/react-router";
import { isReviewTab, type ReviewTab } from "@/lib/search-params";

/** Matches `/review/diffs…`, `/review/recap`, or `/review/overview`. */
const REVIEW_DIFFS_PATH = /\/review\/diffs(?:\/(?:unified|split))?\/?$/;
const REVIEW_RECAP_PATH = /\/review\/recap\/?$/;
const REVIEW_OVERVIEW_PATH = /\/review\/overview\/?$/;

function prTabFromPathname(pathname: string): ReviewTab | undefined {
  if (REVIEW_DIFFS_PATH.test(pathname)) return "diffs";
  if (REVIEW_RECAP_PATH.test(pathname)) return "recap";
  if (REVIEW_OVERVIEW_PATH.test(pathname)) return "overview";
  return undefined;
}

function reviewSubPath(tab: ReviewTab, diffView: string): string {
  if (tab === "diffs") return `diffs/${diffView}`;
  if (tab === "recap") return "recap";
  return "overview";
}

/**
 * Review panel Overview/Diffs/Recap sub-tab. Prefers path segments
 * (`…/review/overview`, `…/review/diffs/…`, `…/review/recap`) on
 * sessions/projects/quick-tasks and falls back to `?prTab=` only when those
 * paths are absent.
 */
export function usePrTabParam() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useSearch({ strict: false });

  const pathTab = prTabFromPathname(pathname);

  const searchTabValue = "prTab" in search ? search.prTab : undefined;
  const searchTab: ReviewTab | undefined =
    typeof searchTabValue === "string" && isReviewTab(searchTabValue)
      ? searchTabValue
      : undefined;

  const prTab = pathTab ?? searchTab;

  const setPrTab = (tab: ReviewTab) => {
    if (pathTab !== undefined) {
      const reviewBase = pathname.replace(/\/review\/.*$/, "/review");
      const viewMatch = pathname.match(/\/review\/diffs\/(unified|split)/);
      const view = viewMatch?.[1] ?? "unified";
      const nextPath = `${reviewBase}/${reviewSubPath(tab, view)}`;
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
