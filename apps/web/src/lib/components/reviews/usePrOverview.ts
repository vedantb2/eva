"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAction } from "convex/react";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import { prErrorMessage, prOverviewQuery } from "@/lib/prReviewQueries";
import type { PrOverview } from "./_components/prOverviewMeta";

export type PrOverviewState =
  | { status: "loading" }
  | { status: "error"; message: string }
  // `refreshing` keeps the panel on screen during a refetch instead of
  // collapsing back to a spinner.
  | { status: "ready"; overview: PrOverview; refreshing: boolean };

/**
 * Loads the Overview payload through TanStack Query, so a PR opened before in
 * this session (or warmed by hovering the reviews list) paints immediately and
 * revalidates behind the scenes. `reload` refetches with both the client cache
 * and the server ActionCache bypassed.
 */
export function usePrOverview(
  repoId: Id<"githubRepos">,
  prNumber: number,
): { state: PrOverviewState; reload: () => void } {
  const getOverview = useAction(api.github.getPullRequestOverview);
  const queryClient = useQueryClient();

  const options = prOverviewQuery(getOverview, repoId, prNumber);
  const query = useQuery(options);

  // Forced because the point of Reload is to get past the server-side
  // ActionCache as well; the result lands in the same cache entry.
  const reload = useMutation({
    mutationFn: () => getOverview({ repoId, prNumber, force: true }),
    onSuccess: (overview) => queryClient.setQueryData(options.queryKey, overview),
  });

  const state = ((): PrOverviewState => {
    if (query.data !== undefined) {
      return {
        status: "ready",
        overview: query.data,
        refreshing: query.isFetching || reload.isPending,
      };
    }
    // A failed revalidate keeps the overview already on screen, so only a cold
    // miss reaches this branch as an error.
    if (query.isError) {
      return {
        status: "error",
        message: prErrorMessage(query.error, "Couldn't load pull request"),
      };
    }
    return { status: "loading" };
  })();

  return { state, reload: () => reload.mutate() };
}
