"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  toast,
} from "@eva/ui";
import { IconGitMerge, IconGitPullRequestClosed } from "@tabler/icons-react";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import { mergeBlocker, mergeStateHeadline } from "./prMergeState";
import { PrMergeBoxChecks } from "./PrMergeBoxChecks";
import { ToneIcon, type PrOverview, type StatusTone } from "./prOverviewMeta";

type MergeMethod = "merge" | "squash" | "rebase";

const MERGE_METHODS: { value: MergeMethod; label: string }[] = [
  { value: "squash", label: "Squash and merge" },
  { value: "merge", label: "Create a merge commit" },
  { value: "rebase", label: "Rebase and merge" },
];

/**
 * The box GitHub puts at the foot of a conversation: whether the branch can
 * merge, who has reviewed, what CI says, and the merge control itself.
 *
 * Merging is irreversible and lands on the base branch, so it stays behind an
 * explicit confirmation, and any GitHub rejection is surfaced verbatim rather
 * than guessed at.
 */
export function PrMergeBox({
  repoId,
  overview,
  onMerged,
}: {
  repoId: Id<"githubRepos">;
  overview: PrOverview;
  onMerged: () => void;
}) {
  const mergePr = useAction(api.github.mergePullRequest);
  const [method, setMethod] = useState<MergeMethod>("squash");
  const [confirming, setConfirming] = useState(false);
  const [merging, setMerging] = useState(false);

  const isOpen = overview.status === "open";
  const canMerge = !overview.draft && overview.mergeable === true;
  const reason = mergeBlocker(overview)?.detail ?? null;
  const methodLabel =
    MERGE_METHODS.find((entry) => entry.value === method)?.label ?? "Merge";

  const runMerge = async () => {
    setMerging(true);
    // No `||` in the try and no `finally`: React Compiler bails on the whole
    // file for either.
    try {
      const result = await mergePr({
        repoId,
        prNumber: overview.number,
        method,
      });
      setConfirming(false);
      if (result.message) {
        toast.success(result.message);
      } else {
        toast.success("Pull request merged");
      }
      onMerged();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not merge the branch",
      );
    }
    setMerging(false);
  };

  return (
    <section className="divide-y divide-border overflow-hidden rounded-md border border-border bg-card">
      <MergeHeaderRow overview={overview} />

      <ReviewsRow overview={overview} />

      <PrMergeBoxChecks
        checks={overview.checks}
        truncated={overview.checksTruncated}
      />

      {isOpen ? (
        <div className="flex flex-wrap items-center gap-2 bg-muted/30 px-3 py-2.5">
          <Select
            value={method}
            onValueChange={(value) => {
              const next = MERGE_METHODS.find((entry) => entry.value === value);
              if (next) setMethod(next.value);
            }}
          >
            <SelectTrigger className="h-8 w-54 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MERGE_METHODS.map((entry) => (
                <SelectItem key={entry.value} value={entry.value}>
                  {entry.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* The Select already names the method, so the button states the
              action instead of repeating the label back. */}
          <Button
            size="sm"
            disabled={!canMerge}
            onClick={() => setConfirming(true)}
          >
            <IconGitMerge size={14} aria-hidden />
            Merge pull request
          </Button>

          {reason ? (
            <p className="min-w-0 flex-1 text-xs text-muted-foreground">
              {reason}
            </p>
          ) : null}
        </div>
      ) : null}

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{methodLabel}?</DialogTitle>
            <DialogDescription>
              This merges <span className="font-mono">{overview.headRef}</span>{" "}
              into <span className="font-mono">{overview.baseRef}</span> on
              GitHub. It cannot be undone from Eva.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setConfirming(false)}
              disabled={merging}
            >
              Cancel
            </Button>
            <Button onClick={() => void runMerge()} disabled={merging}>
              {merging ? <Spinner size="sm" /> : <IconGitMerge size={14} />}
              {merging ? "Merging" : methodLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function MergeHeaderRow({ overview }: { overview: PrOverview }) {
  if (overview.status === "merged") {
    return (
      <p className="flex items-center gap-2 px-3 py-2.5 text-sm text-violet-700 dark:text-violet-300">
        <IconGitMerge size={16} className="shrink-0" aria-hidden />
        <span>
          Merged
          {overview.mergedByLogin ? ` by ${overview.mergedByLogin}` : ""}
          {overview.mergedAt ? " " : ""}
          {overview.mergedAt ? (
            <RelativeDateTime at={new Date(overview.mergedAt).getTime()} />
          ) : null}
        </span>
      </p>
    );
  }

  if (overview.status === "closed") {
    return (
      <p className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground">
        <IconGitPullRequestClosed
          size={16}
          className="shrink-0 text-destructive"
          aria-hidden
        />
        Closed without merging.
      </p>
    );
  }

  const { tone, text } = mergeStateHeadline(overview);
  return (
    <p className="flex items-center gap-2 px-3 py-2.5 text-sm">
      <ToneIcon tone={tone} size={16} />
      {text}
    </p>
  );
}

/**
 * Review standing in one line. Reviews arrive already collapsed to the latest
 * verdict per reviewer, so this counts people rather than review events.
 */
function ReviewsRow({ overview }: { overview: PrOverview }) {
  const approvals = overview.reviews.filter(
    (review) => review.state === "APPROVED",
  ).length;
  const changesRequested = overview.reviews.filter(
    (review) => review.state === "CHANGES_REQUESTED",
  ).length;
  const awaiting = overview.requestedReviewers.length;

  const parts = [
    approvals > 0
      ? `${approvals} ${approvals === 1 ? "approval" : "approvals"}`
      : null,
    changesRequested > 0
      ? `${changesRequested} ${changesRequested === 1 ? "change" : "changes"} requested`
      : null,
    awaiting > 0 ? `${awaiting} awaiting review` : null,
  ].filter((part) => part !== null);

  const tone: StatusTone =
    changesRequested > 0 ? "failure" : approvals > 0 ? "success" : "neutral";

  return (
    <p className="flex items-center gap-2 px-3 py-2.5 text-sm">
      <ToneIcon tone={tone} size={16} />
      <span className="min-w-0 truncate">
        {parts.length === 0 ? "No reviews yet" : parts.join(" · ")}
      </span>
    </p>
  );
}
