"use client";

import { useCallback, useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import { prNumberFromGithubUrl } from "@/lib/githubPr";
import { loadPrDiff, peekPrDiff, type PrDiffData } from "@/lib/prReviewCache";

export type PrDiffState =
  | { status: "loading" }
  | { status: "error" }
  | ({
      status: "ready";
      /** True while a background revalidate or manual refresh is in flight. */
      refreshing: boolean;
    } & PrDiffData);

function cachedState(
  repoId: Id<"githubRepos">,
  prNumber: number | undefined,
): PrDiffState {
  if (prNumber === undefined) return { status: "loading" };
  const cached = peekPrDiff({ repoId, prNumber });
  if (cached === undefined) return { status: "loading" };
  return { status: "ready", ...cached.value, refreshing: cached.stale };
}

/**
 * Loads a pull request's diff, already split into per-file entries. `getPrDiff`
 * is a Convex action rather than a reactive query, so the fetch is imperative
 * and goes through the module-level SWR cache: a PR seen before in this session
 * paints from cache and revalidates behind the scenes. `refresh` re-runs the
 * fetch with both the client cache and the server ActionCache bypassed.
 */
export function usePrDiff(
  prUrl: string | undefined,
  repoId: Id<"githubRepos">,
): { state: PrDiffState; refresh: () => void } {
  const getPrDiff = useAction(api.github.getPrDiff);
  const prNumber =
    prUrl === undefined ? undefined : prNumberFromGithubUrl(prUrl);
  // Bumped by Refresh to force the load effect to re-run.
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState<PrDiffState>(() =>
    cachedState(repoId, prNumber),
  );

  useEffect(() => {
    if (prUrl === undefined) return;
    if (prNumber === undefined) {
      setState({ status: "error" });
      return;
    }
    let cancelled = false;
    const key = { repoId, prNumber };
    const cached = peekPrDiff(key);
    const force = reloadKey > 0;

    if (cached === undefined) {
      setState({ status: "loading" });
    } else {
      const refreshing = cached.stale || force;
      setState({ status: "ready", ...cached.value, refreshing });
      // Fresh enough and not an explicit refresh — nothing to fetch.
      if (!refreshing) return;
    }

    loadPrDiff(getPrDiff, key, force)
      .then((data) => {
        if (!cancelled) setState({ status: "ready", ...data, refreshing: false });
      })
      .catch(() => {
        if (cancelled) return;
        // A failed revalidate keeps the diff already on screen; only a cold
        // miss has nothing to show and becomes an error.
        setState(
          cached === undefined
            ? { status: "error" }
            : { status: "ready", ...cached.value, refreshing: false },
        );
      });

    return () => {
      cancelled = true;
    };
  }, [prUrl, prNumber, repoId, reloadKey, getPrDiff]);

  const refresh = useCallback(() => setReloadKey((key) => key + 1), []);

  return { state, refresh };
}
