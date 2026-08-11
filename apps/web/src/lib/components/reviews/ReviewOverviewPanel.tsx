"use client";

import type { Id } from "@eva/backend";
import { Button, Spinner } from "@eva/ui";
import { IconAlertTriangle } from "@tabler/icons-react";
import type { PrOverviewState } from "./usePrOverview";
import { PrCommentComposer } from "./_components/PrCommentComposer";
import { PrDescriptionSection } from "./_components/PrDescriptionSection";
import { PrMergeBox } from "./_components/PrMergeBox";
import { PrSidebar } from "./_components/PrSidebar";
import { PrTimeline } from "./_components/PrTimeline";

/**
 * The Overview tab shared by the standalone Reviews page and the sandbox Review
 * tab: GitHub's Conversation layout — description, then the timeline, then the
 * merge box, with reviewers and labels alongside — so a review needs no trip to
 * GitHub.
 *
 * The payload is passed in rather than read here: the shared header above the tab
 * row shows the same overview, and one reader keeps the two in step.
 */
export function ReviewOverviewPanel({
  repoId,
  prNumber,
  state,
  reload,
}: {
  repoId: Id<"githubRepos">;
  prNumber: number;
  state: PrOverviewState;
  reload: () => void;
}) {
  if (state.status === "idle" || state.status === "loading") {
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

  const { overview } = state;

  return (
    // `h-full`, not `flex-1`: the sandbox Review tab mounts this inside a plain
    // block TabsContent, where a flex item's basis never resolves and the
    // scroll container ends up unbounded.
    <div className="h-full overflow-auto">
      {/* Container query, not a viewport breakpoint: the same panel renders both
          full-width on /reviews and in a narrow session pane, so the layout has
          to respond to its own width. */}
      <div className="mx-auto max-w-7xl px-4 py-4 @container">
        <div className="grid grid-cols-1 gap-5 [@container(min-width:56rem)]:grid-cols-[minmax(0,1fr)_16.5rem]">
          <div className="min-w-0 space-y-5">
            <PrDescriptionSection repoId={repoId} overview={overview} />
            <PrTimeline repoId={repoId} overview={overview} />
            <PrCommentComposer
              repoId={repoId}
              prNumber={prNumber}
              onPosted={reload}
            />
            <PrMergeBox repoId={repoId} overview={overview} onMerged={reload} />
          </div>

          {/* Narrow panes stack this under the merge box, as GitHub does. */}
          <aside className="min-w-0">
            <PrSidebar overview={overview} />
          </aside>
        </div>
      </div>
    </div>
  );
}
