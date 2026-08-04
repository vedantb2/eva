"use client";

import { useCallback, useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import { loadPrOverview, peekPrOverview } from "@/lib/prReviewCache";
import type { PrOverview } from "./_components/prOverviewMeta";

export type PrOverviewState =
  | { status: "loading" }
  | { status: "error"; message: string }
  // `refreshing` keeps the panel on screen during a refetch instead of
  // collapsing back to a spinner.
  | { status: "ready"; overview: PrOverview; refreshing: boolean };

function cachedState(
  repoId: Id<"githubRepos">,
  prNumber: number,
): PrOverviewState {
  const cached = peekPrOverview({ repoId, prNumber });
  if (cached === undefined) return { status: "loading" };
  return {
    status: "ready",
    overview: cached.value,
    refreshing: cached.stale,
  };
}

/**
 * Loads the Overview payload through the module-level SWR cache, so a PR opened
 * before in this session (or warmed by hovering the reviews list) paints
 * immediately and revalidates behind the scenes. `reload` refetches with both
 * the client cache and the server ActionCache bypassed.
 */
export function usePrOverview(
  repoId: Id<"githubRepos">,
  prNumber: number,
): { state: PrOverviewState; reload: () => void } {
  const getOverview = useAction(api.github.getPullRequestOverview);
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState<PrOverviewState>(() =>
    cachedState(repoId, prNumber),
  );

  useEffect(() => {
    let cancelled = false;
    const key = { repoId, prNumber };
    const cached = peekPrOverview(key);
    const force = reloadKey > 0;

    if (cached === undefined) {
      setState({ status: "loading" });
    } else {
      const refreshing = cached.stale || force;
      setState({ status: "ready", overview: cached.value, refreshing });
      // Fresh enough and not an explicit reload — nothing to fetch.
      if (!refreshing) return;
    }

    loadPrOverview(getOverview, key, force)
      .then((overview) => {
        if (!cancelled) {
          setState({ status: "ready", overview, refreshing: false });
        }
      })
      .catch((error: Error) => {
        if (cancelled) return;
        // A failed revalidate keeps the overview already on screen; only a cold
        // miss has nothing to show and becomes an error.
        setState(
          cached === undefined
            ? {
                status: "error",
                message: error.message || "Couldn't load pull request",
              }
            : {
                status: "ready",
                overview: cached.value,
                refreshing: false,
              },
        );
      });

    return () => {
      cancelled = true;
    };
  }, [repoId, prNumber, getOverview, reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return { state, reload };
}
