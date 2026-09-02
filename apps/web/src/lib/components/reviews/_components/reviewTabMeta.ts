import {
  IconCircleCheck,
  IconFileDiff,
  IconGitCommit,
  IconMessages,
  IconSparkles,
  type Icon as TablerIcon,
} from "@tabler/icons-react";
import type { ReviewTab } from "@/lib/search-params";
import { countChecks } from "./prMergeState";
import type { PrOverview } from "./prOverviewMeta";

/**
 * The tab row, in one table: order, label, icon. Every review surface renders
 * from this, so a tab cannot pick up a different name or glyph on the standalone
 * page than it has in a session.
 *
 * Labels are not the URL slugs — `overview` reads "Activity" and `diffs` reads
 * "Changes" (see `search-params.ts` for why the slugs stayed put). Nothing else
 * may restate either string.
 */
export const REVIEW_TAB_ORDER: readonly ReviewTab[] = [
  "overview",
  "commits",
  "checks",
  "diffs",
  "recap",
];

export const REVIEW_TAB_META: Record<
  ReviewTab,
  { label: string; icon: TablerIcon }
> = {
  overview: { label: "Activity", icon: IconMessages },
  commits: { label: "Commits", icon: IconGitCommit },
  checks: { label: "Checks", icon: IconCircleCheck },
  diffs: { label: "Changes", icon: IconFileDiff },
  recap: { label: "Recap", icon: IconSparkles },
};

/**
 * The size of what a tab holds, said on the tab itself. Null where there is
 * nothing worth a number: a reserved slot that fills a beat later moves the whole
 * row, and a tab reading "0" spends a number saying what the empty panel says.
 *
 * Checks is the one tab whose count is a fraction — "5/6" answers "is CI done and
 * did it pass" in three characters, where a bare total answers neither.
 */
export function reviewTabCount(
  tab: ReviewTab,
  overview: PrOverview | null,
): { text: string; muted: boolean } | null {
  if (overview === null) return null;

  if (tab === "overview") {
    const count = overview.comments.length;
    if (count === 0) return null;
    return {
      text: `${count}${overview.commentsTruncated ? "+" : ""}`,
      muted: true,
    };
  }

  if (tab === "commits") {
    if (overview.commitCount === 0) return null;
    return { text: String(overview.commitCount), muted: true };
  }

  if (tab === "checks") {
    const counts = countChecks(overview.checks);
    if (counts.total === 0) return null;
    // Failing checks are the one count on this row worth colour: a reviewer
    // scanning the tabs should not have to open one to find out CI is red.
    return {
      text: `${counts.success}/${counts.total}`,
      muted: counts.failure === 0,
    };
  }

  if (tab === "diffs") {
    if (overview.changedFiles === 0) return null;
    return { text: String(overview.changedFiles), muted: true };
  }

  return null;
}
