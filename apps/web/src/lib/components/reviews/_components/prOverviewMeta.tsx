"use client";

import type { FunctionReturnType } from "convex/server";
import type { api } from "@eva/backend";
import {
  IconCircleCheck,
  IconCircleX,
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
    return <IconCircleCheck size={size} className="shrink-0 text-success" />;
  }
  if (tone === "failure") {
    return <IconCircleX size={size} className="shrink-0 text-destructive" />;
  }
  return <IconMinus size={size} className="shrink-0 text-muted-foreground" />;
}

/**
 * The lifecycle label plus the tone its glyph carries. Same vocabulary GitHub
 * uses, but the colour lives on the icon only — merged reads violet through the
 * code-review status token, open green, closed red, and a draft stays grey so it
 * does not look ready. The label itself is neutral text in a quiet badge.
 */
export function statusMeta(
  status: PrOverview["status"],
  draft: boolean,
): { label: string; glyphClassName: string } {
  if (status === "merged") {
    return { label: "Merged", glyphClassName: "text-status-code-review" };
  }
  if (status === "closed") {
    return { label: "Closed", glyphClassName: "text-destructive" };
  }
  if (draft) {
    return { label: "Draft", glyphClassName: "text-muted-foreground" };
  }
  return { label: "Open", glyphClassName: "text-success" };
}

/** Shared idiom for a quiet, non-blocking notice (truncation, empty states). */
export const NOTICE_CLASS =
  "rounded-control border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground";

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
