import {
  checkTone,
  type PrCheck,
  type PrOverview,
  type StatusTone,
} from "./prOverviewMeta";

/**
 * Everything both review surfaces need to say about whether a pull request can
 * merge, derived in one place. The header states it compactly above the tabs and
 * the merge box states it at length at the foot of Overview, so the two would
 * drift the moment either re-derived it — the wording differences below are
 * deliberate registers of one verdict, not two verdicts.
 */

export type CheckCounts = Record<StatusTone, number> & { total: number };

export function countChecks(checks: readonly PrCheck[]): CheckCounts {
  const counts: CheckCounts = {
    success: 0,
    failure: 0,
    pending: 0,
    neutral: 0,
    total: checks.length,
  };
  for (const check of checks) {
    counts[checkTone(check)] += 1;
  }
  return counts;
}

/**
 * The worst outcome wins: one failing check matters more than twenty passing
 * ones, and anything still running outranks a clean result that is not final.
 */
export function checksOverallTone(counts: CheckCounts): StatusTone {
  if (counts.failure > 0) return "failure";
  if (counts.pending > 0) return "pending";
  if (counts.success > 0) return "success";
  return "neutral";
}

/** The merge box's line, which has room to break every outcome out. */
export function checksHeadline(counts: CheckCounts): string {
  if (counts.failure === 0 && counts.pending === 0 && counts.success > 0) {
    return "All checks have passed";
  }
  const parts = [
    counts.failure > 0 ? `${counts.failure} failing` : null,
    counts.pending > 0 ? `${counts.pending} in progress` : null,
    counts.success > 0 ? `${counts.success} passing` : null,
    counts.neutral > 0 ? `${counts.neutral} skipped` : null,
  ].filter((part) => part !== null);
  return parts.join(" · ");
}

/**
 * The tab row's pill, which has room for one number. "1 of 17 failing" answers
 * "is CI broken and how badly" in a glance, where the headline's full breakdown
 * would be truncated to uselessness at this width.
 */
export function checksPillLabel(counts: CheckCounts): string | null {
  if (counts.total === 0) return null;
  if (counts.failure > 0) return `${counts.failure} of ${counts.total} failing`;
  if (counts.pending > 0) return `${counts.pending} of ${counts.total} running`;
  if (counts.success === 0) return `${counts.total} skipped`;
  if (counts.success === counts.total) return "All checks passed";
  return `${counts.success} of ${counts.total} passed`;
}

/**
 * Work eva can do about a blocker itself. Conflicts and a stale branch are both
 * ordinary agent tasks on the head branch, so the header offers a session rather
 * than leaving the reader at a dead end with GitHub's verdict.
 */
export interface PrRemedy {
  /** Button wording — an imperative naming what the session will do. */
  action: string;
  sessionTitle: string;
  prompt: string;
}

export interface PrBlocker {
  tone: StatusTone;
  /** Badge wording for the header, at GitHub's brevity. */
  label: string;
  /** The merge box's headline sentence. */
  headline: string;
  /** What the reader has to do about it, spelled out. */
  detail: string;
  remedy: PrRemedy | null;
}

/** Null when an open pull request has nothing standing in the way of merging. */
export function mergeBlocker(overview: PrOverview): PrBlocker | null {
  if (overview.status !== "open") return null;

  if (overview.draft) {
    return {
      tone: "neutral",
      label: "Draft",
      headline: "This pull request is still a draft",
      detail: "Mark the pull request ready for review to merge.",
      remedy: null,
    };
  }

  if (overview.mergeable === null) {
    return {
      tone: "pending",
      label: "Checking mergeability",
      headline: "Checking whether this can be merged",
      detail:
        "GitHub is still working out whether this can merge. Refresh in a moment.",
      remedy: null,
    };
  }

  if (overview.mergeable === false) {
    if (overview.mergeableState === "dirty") {
      return {
        tone: "failure",
        label: "Merge conflicts",
        headline: "This branch has conflicts that must be resolved",
        detail: "There are conflicts with the base branch.",
        remedy: {
          action: "Resolve in a new session",
          sessionTitle: `Resolve conflicts on #${overview.number}`,
          prompt: `Rebase this branch onto \`${overview.baseRef}\` and resolve every merge conflict. Keep the intent of both sides where they disagree, run a typecheck, then push the branch.`,
        },
      };
    }
    return {
      tone: "failure",
      label: "Cannot merge",
      headline: "This branch cannot be merged yet",
      detail: `GitHub reports this branch as ${overview.mergeableState}.`,
      remedy: null,
    };
  }

  if (overview.mergeableState === "blocked") {
    return {
      tone: "failure",
      label: "Merge blocked",
      headline: "Merging is blocked",
      detail:
        "Branch protection still has unmet requirements, so GitHub may reject the merge.",
      remedy: null,
    };
  }

  if (overview.mergeableState === "behind") {
    return {
      tone: "pending",
      label: "Behind base",
      headline: "This branch is behind the base branch",
      detail:
        "The branch is behind the base branch and may need updating first.",
      remedy: {
        action: "Update in a new session",
        sessionTitle: `Update #${overview.number} from ${overview.baseRef}`,
        prompt: `Merge \`${overview.baseRef}\` into this branch to bring it up to date, run a typecheck, then push the branch.`,
      },
    };
  }

  return null;
}

/** The merge box's top line: the blocker's headline, or the all-clear. */
export function mergeStateHeadline(overview: PrOverview): {
  tone: StatusTone;
  text: string;
} {
  const blocker = mergeBlocker(overview);
  if (blocker) return { tone: blocker.tone, text: blocker.headline };
  return {
    tone: "success",
    text: "This branch has no conflicts with the base branch",
  };
}
