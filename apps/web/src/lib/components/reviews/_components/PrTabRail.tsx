import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import { DiffCountBar } from "@/lib/components/sandbox/DiffFileBadges";
import type { PrOverview } from "./prOverviewMeta";

/**
 * The right end of the tab row: how fresh the payload is, and how big the change
 * is. Two facts that stay true whichever tab is open, so they sit on the row that
 * is always on screen rather than inside one panel.
 *
 * They used to trail the author/branch line in the header. That line already
 * carried five things and wrapped on any narrow pane; the tab row has an empty
 * right half on every surface, which is exactly the width these two need.
 */
export function PrTabRail({ overview }: { overview: PrOverview }) {
  return (
    <span className="flex min-w-0 items-center gap-3 text-xs text-muted-foreground">
      <span className="hidden whitespace-nowrap sm:inline">
        {"Updated "}
        <RelativeDateTime at={new Date(overview.updatedAt).getTime()} />
        {" ago"}
      </span>
      <DiffCountBar
        additions={overview.additions}
        deletions={overview.deletions}
      />
    </span>
  );
}
