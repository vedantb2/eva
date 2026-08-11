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
import { mergeBlocker } from "./prMergeState";
import { PrMergeBoxChecks } from "./PrMergeBoxChecks";
import {
  SECTION_LABEL_CLASS,
  ToneIcon,
  type PrOverview,
  type StatusTone,
} from "./prOverviewMeta";

type MergeMethod = "merge" | "squash" | "rebase";

const MERGE_METHODS: { value: MergeMethod; label: string }[] = [
  { value: "squash", label: "Squash and merge" },
  { value: "merge", label: "Create a merge commit" },
  { value: "rebase", label: "Rebase and merge" },
];

/**
 * The merge decision at the foot of the conversation: who has reviewed, what CI
 * says, and the control itself.
 *
 * Named by a label and not drawn as a box. The filled Merge button is the loudest
 * control on the page, which is enough to find it after a long scroll; an outline
 * and four divider rules around it were emphasis spent twice.
 *
 * Every line here renders only when it has something to report — a branch nobody
 * has reviewed shows no reviews line, because "No reviews yet" is a sentence the
 * blank space already says.
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
    <section className="space-y-2">
      <p className={SECTION_LABEL_CLASS}>Merge</p>

      <div className="space-y-1.5">
        <MergeHeaderRow overview={overview} />
        <ReviewsRow overview={overview} />
        <PrMergeBoxChecks
          checks={overview.checks}
          truncated={overview.checksTruncated}
        />
      </div>

      {isOpen ? (
        <div className="flex flex-wrap items-center gap-2 pt-1">
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

/**
 * What happened, or the all-clear. Null while a blocker is in play: the header
 * above the tabs states that in colour, and repeating it here would be the same
 * sentence twice on one screen. The reason the Merge button is disabled still sits
 * beside the button, where it answers the question the reader is actually asking.
 */
function MergeHeaderRow({ overview }: { overview: PrOverview }) {
  if (overview.status === "merged") {
    return (
      <p className="flex items-center gap-2 text-sm text-violet-700 dark:text-violet-300">
        <IconGitMerge size={15} className="shrink-0" aria-hidden />
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
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <IconGitPullRequestClosed
          size={15}
          className="shrink-0 text-destructive"
          aria-hidden
        />
        Closed without merging.
      </p>
    );
  }

  if (mergeBlocker(overview) !== null) return null;

  return (
    <p className="flex items-center gap-2 text-sm">
      <ToneIcon tone="success" size={15} />
      No conflicts with{" "}
      <span className="font-mono text-xs">{overview.baseRef}</span>
    </p>
  );
}

/**
 * Review standing in one line, and nothing at all when nobody has reviewed or been
 * asked to. Reviews arrive already collapsed to the latest verdict per reviewer, so
 * this counts people rather than review events.
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

  if (parts.length === 0) return null;

  const tone: StatusTone = changesRequested > 0 ? "failure" : "success";

  return (
    <p className="flex items-center gap-2 text-sm">
      <ToneIcon tone={tone} size={15} />
      <span className="min-w-0 truncate">{parts.join(" · ")}</span>
    </p>
  );
}
