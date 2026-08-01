import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import { Button, Spinner } from "@eva/ui";
import { IconAlertTriangle, IconRefresh } from "@tabler/icons-react";
import { PrChecksCard } from "./_components/PrChecksCard";
import { PrCommitsCard } from "./_components/PrCommitsCard";
import { PrConversationCard } from "./_components/PrConversationCard";
import { PrDescriptionCard } from "./_components/PrDescriptionCard";
import { PrMergeCard } from "./_components/PrMergeCard";
import { PrReviewersCard } from "./_components/PrReviewersCard";
import { PrSummaryCard } from "./_components/PrSummaryCard";
import type { PrOverview } from "./_components/prOverviewMeta";

type OverviewLoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  // `refreshing` keeps the panel on screen during a manual refetch instead of
  // collapsing back to a spinner.
  | { status: "ready"; overview: PrOverview; refreshing: boolean };

/**
 * The Overview tab shared by the standalone Reviews page and the sandbox Review
 * tab: description, conversation, checks, reviewers, commits, and merge — so a
 * review needs no trip to GitHub.
 */
export function ReviewOverviewPanel({
  repoId,
  prNumber,
}: {
  repoId: Id<"githubRepos">;
  prNumber: number;
}) {
  const getOverview = useAction(api.github.getPullRequestOverview);
  const [state, setState] = useState<OverviewLoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // Same PR reloading (refresh, post-merge) keeps its data; a different PR
    // starts from scratch so no stale numbers flash.
    setState((prev) =>
      prev.status === "ready" && prev.overview.number === prNumber
        ? { ...prev, refreshing: true }
        : { status: "loading" },
    );
    // reloadKey > 0 means an explicit refresh — bypass the ActionCache TTL.
    getOverview({ repoId, prNumber, force: reloadKey > 0 })
      .then((overview) => {
        if (!cancelled) {
          setState({ status: "ready", overview, refreshing: false });
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: error.message || "Couldn't load pull request",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [repoId, prNumber, getOverview, reloadKey]);

  const reload = () => setReloadKey((key) => key + 1);

  if (state.status === "loading") {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="sm" />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <IconAlertTriangle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-destructive">{state.message}</p>
        <Button size="sm" variant="secondary" onClick={reload}>
          Retry
        </Button>
      </div>
    );
  }

  const { overview, refreshing } = state;

  return (
    // `h-full`, not `flex-1`: the sandbox Review tab mounts this inside a plain
    // block TabsContent, where a flex item's basis never resolves and the
    // scroll container ends up unbounded.
    <div className="h-full overflow-auto">
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-4">
        <div className="flex items-center justify-end">
          <Button
            size="sm"
            variant="ghost"
            onClick={reload}
            disabled={refreshing}
            className="text-muted-foreground"
          >
            {refreshing ? (
              <Spinner size="sm" />
            ) : (
              <IconRefresh className="size-3.5" aria-hidden />
            )}
            Refresh
          </Button>
        </div>

        <PrSummaryCard overview={overview} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="min-w-0 space-y-4">
            <PrDescriptionCard body={overview.body} />
            <PrConversationCard
              comments={overview.comments}
              truncated={overview.commentsTruncated}
            />
          </div>

          <aside className="min-w-0 space-y-4">
            <PrMergeCard
              repoId={repoId}
              overview={overview}
              onMerged={reload}
            />
            <PrChecksCard
              checks={overview.checks}
              truncated={overview.checksTruncated}
            />
            <PrReviewersCard
              reviews={overview.reviews}
              requestedReviewers={overview.requestedReviewers}
              assignees={overview.assignees}
            />
            <PrCommitsCard
              commits={overview.commits}
              commitCount={overview.commitCount}
              truncated={overview.commitsTruncated}
            />
          </aside>
        </div>
      </div>
    </div>
  );
}
