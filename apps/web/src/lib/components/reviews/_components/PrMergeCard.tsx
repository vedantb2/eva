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
import { IconGitMerge, IconInfoCircle } from "@tabler/icons-react";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import { OverviewCard } from "./OverviewCard";
import type { PrOverview } from "./prOverviewMeta";

type MergeMethod = "merge" | "squash" | "rebase";

const MERGE_METHODS: { value: MergeMethod; label: string }[] = [
  { value: "squash", label: "Squash and merge" },
  { value: "merge", label: "Create a merge commit" },
  { value: "rebase", label: "Rebase and merge" },
];

/** Plain-English reason a merge cannot proceed, or null when it can. */
function blockedReason(overview: PrOverview): string | null {
  if (overview.draft) return "Mark the pull request ready for review to merge.";
  if (overview.mergeable === null) {
    return "GitHub is still working out whether this can merge. Refresh in a moment.";
  }
  if (overview.mergeable === false) {
    return overview.mergeableState === "dirty"
      ? "There are conflicts with the base branch."
      : `GitHub reports this branch as ${overview.mergeableState}.`;
  }
  if (overview.mergeableState === "blocked") {
    return "Branch protection still has unmet requirements, so GitHub may reject the merge.";
  }
  if (overview.mergeableState === "behind") {
    return "The branch is behind the base branch and may need updating first.";
  }
  return null;
}

/**
 * Merge control for the Overview tab. Merging is irreversible and lands on the
 * base branch, so it is always behind an explicit confirmation, and any GitHub
 * rejection is surfaced verbatim rather than guessed at.
 */
export function PrMergeCard({
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

  if (overview.status === "merged") {
    return (
      <OverviewCard title="Merge">
        <p className="flex items-center gap-2 text-sm text-violet-700 dark:text-violet-300">
          <IconGitMerge className="size-4 shrink-0" />
          <span>
            Merged
            {overview.mergedByLogin ? ` by ${overview.mergedByLogin}` : ""}
            {overview.mergedAt ? " " : ""}
            {overview.mergedAt ? (
              <RelativeDateTime at={new Date(overview.mergedAt).getTime()} />
            ) : null}
          </span>
        </p>
      </OverviewCard>
    );
  }

  if (overview.status === "closed") {
    return (
      <OverviewCard title="Merge">
        <p className="text-sm text-muted-foreground">
          This pull request was closed without merging.
        </p>
      </OverviewCard>
    );
  }

  const reason = blockedReason(overview);
  const canMerge = !overview.draft && overview.mergeable === true;
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
    <OverviewCard title="Merge">
      <div className="space-y-2.5">
        <Select
          value={method}
          onValueChange={(value) => {
            const next = MERGE_METHODS.find((entry) => entry.value === value);
            if (next) setMethod(next.value);
          }}
        >
          <SelectTrigger className="h-8 w-full text-xs">
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

        <Button
          size="sm"
          className="w-full"
          disabled={!canMerge}
          onClick={() => setConfirming(true)}
        >
          <IconGitMerge className="size-3.5" />
          {methodLabel}
        </Button>

        {reason ? (
          <p className="flex gap-1.5 text-xs text-muted-foreground">
            <IconInfoCircle className="size-3.5 mt-px shrink-0" />
            {reason}
          </p>
        ) : null}
      </div>

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
              {merging ? (
                <Spinner size="sm" />
              ) : (
                <IconGitMerge className="size-3.5" />
              )}
              {merging ? "Merging" : methodLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </OverviewCard>
  );
}
