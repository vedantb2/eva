"use client";

import type { FunctionReturnType } from "convex/server";
import type { api } from "@eva/backend";
import { cn } from "@eva/ui";
import {
  IconCircleCheck,
  IconCircleX,
  IconGitMerge,
  IconGitPullRequest,
  IconGitPullRequestClosed,
  IconGitPullRequestDraft,
  IconLoader2,
  IconMessageCircle,
  IconMinus,
} from "@tabler/icons-react";

/**
 * Convex is the single source of truth for the Overview shape — every card
 * below indexes into this type rather than restating fields.
 */
export type PrOverview = FunctionReturnType<
  typeof api.github.getPullRequestOverview
>;
export type PrCheck = PrOverview["checks"][number];
export type PrReview = PrOverview["reviews"][number];
export type PrReviewEvent = PrOverview["reviewEvents"][number];
export type PrCommit = PrOverview["commits"][number];
export type PrComment = PrOverview["comments"][number];
export type PrLabel = PrOverview["labels"][number];
export type PrActor = PrOverview["assignees"][number];

export type StatusTone = "success" | "failure" | "pending" | "neutral";

/** Maps a check run or commit status onto one of four visual tones. */
export function checkTone(check: PrCheck): StatusTone {
  if (check.status !== "completed") return "pending";
  if (check.conclusion === "success") return "success";
  if (
    check.conclusion === "failure" ||
    check.conclusion === "timed_out" ||
    check.conclusion === "cancelled" ||
    check.conclusion === "action_required"
  ) {
    return "failure";
  }
  return "neutral";
}

export function ToneIcon({
  tone,
  size = 14,
}: {
  tone: StatusTone;
  size?: number;
}) {
  if (tone === "pending") {
    return (
      <IconLoader2
        size={size}
        className="shrink-0 animate-spin text-muted-foreground"
      />
    );
  }
  if (tone === "success") {
    return (
      <IconCircleCheck
        size={size}
        className="shrink-0 text-emerald-600 dark:text-emerald-400"
      />
    );
  }
  if (tone === "failure") {
    return <IconCircleX size={size} className="shrink-0 text-destructive" />;
  }
  return <IconMinus size={size} className="shrink-0 text-muted-foreground" />;
}

/**
 * The lifecycle pill, worded and coloured as GitHub does: open is green, merged
 * is violet, closed-without-merging is red, and a draft is deliberately grey so
 * it does not read as ready.
 */
export function statusMeta(
  status: PrOverview["status"],
  draft: boolean,
): { label: string; className: string } {
  if (status === "merged") {
    return {
      label: "Merged",
      className:
        "border-border bg-violet-500/10 text-violet-700 dark:text-violet-300",
    };
  }
  if (status === "closed") {
    return {
      label: "Closed",
      className: "border-border bg-destructive/10 text-destructive",
    };
  }
  if (draft) {
    return {
      label: "Draft",
      className: "border-border bg-muted text-muted-foreground",
    };
  }
  return {
    label: "Open",
    className:
      "border-border bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  };
}

/**
 * The lifecycle pill itself. Rendered from `statusMeta` rather than beside it, so
 * a surface cannot pair one status's wording with another's colour.
 */
export function PrStatusPill({
  status,
  draft,
}: {
  status: PrOverview["status"];
  draft: boolean;
}) {
  const meta = statusMeta(status, draft);
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        meta.className,
      )}
    >
      {status === "merged" ? (
        <IconGitMerge size={13} aria-hidden />
      ) : status === "closed" ? (
        <IconGitPullRequestClosed size={13} aria-hidden />
      ) : draft ? (
        // Its own glyph, as GitHub does: the pill is the only thing on the header
        // that says a branch is not ready, now that the blocker row does not
        // repeat it.
        <IconGitPullRequestDraft size={13} aria-hidden />
      ) : (
        <IconGitPullRequest size={13} aria-hidden />
      )}
      {meta.label}
    </span>
  );
}

/** Shared idiom for a quiet, non-blocking notice (truncation, empty states). */
export const NOTICE_CLASS =
  "rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground";

/**
 * Review states as GitHub words them, plus the tone that drives the icon.
 * "Commented" is deliberately neutral — it neither blocks nor unblocks.
 */
export function reviewStateMeta(state: string): {
  label: string;
  tone: StatusTone;
} {
  if (state === "APPROVED") return { label: "Approved", tone: "success" };
  if (state === "CHANGES_REQUESTED") {
    return { label: "Requested changes", tone: "failure" };
  }
  if (state === "DISMISSED") return { label: "Dismissed", tone: "neutral" };
  if (state === "PENDING") return { label: "Pending", tone: "pending" };
  return { label: "Commented", tone: "neutral" };
}

export function ReviewStateIcon({ state }: { state: string }) {
  if (state === "COMMENTED") {
    return (
      <IconMessageCircle size={14} className="shrink-0 text-muted-foreground" />
    );
  }
  return <ToneIcon tone={reviewStateMeta(state).tone} />;
}

export function shortSha(sha: string): string {
  return sha.slice(0, 7);
}

/** Shared prose styling for GitHub-authored markdown (description, comments). */
export const MARKDOWN_CLASS =
  "prose prose-sm dark:prose-invert max-w-none text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0";
