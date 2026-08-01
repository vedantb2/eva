import { cn } from "@eva/ui";
import {
  IconArrowRight,
  IconExternalLink,
  IconGitBranch,
} from "@tabler/icons-react";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import { OverviewCard } from "./OverviewCard";
import { statusBadgeClass, type PrOverview } from "./prOverviewMeta";

function Stat({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="min-w-0 px-3 py-2">
      <div className="truncate text-2xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className={cn("text-lg font-semibold tabular-nums", className)}>
        {value}
      </div>
    </div>
  );
}

/**
 * Header strip: lifecycle, branches, author, labels, and the size of the change.
 * The title is intentionally absent — both callers (standalone Reviews page and
 * the sandbox Review tab) already render it in their own chrome.
 */
export function PrSummaryCard({ overview }: { overview: PrOverview }) {
  const totalLoc = overview.additions + overview.deletions;
  // Guard against 0/0 so an empty diff renders a flat bar rather than NaN.
  const addedShare = totalLoc === 0 ? 0 : (overview.additions / totalLoc) * 100;

  return (
    <OverviewCard>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span
            className={cn(
              "inline-flex rounded-md border px-2 py-0.5 font-medium capitalize",
              statusBadgeClass(overview.status, overview.draft),
            )}
          >
            {overview.status}
          </span>
          {overview.draft ? (
            <span className="inline-flex rounded-md border border-border bg-muted px-2 py-0.5 font-medium text-muted-foreground">
              Draft
            </span>
          ) : null}

          <span className="inline-flex min-w-0 items-center gap-1.5 rounded-md border border-border bg-muted/50 px-2 py-0.5 font-mono text-muted-foreground">
            <IconGitBranch className="size-3 shrink-0" />
            <span className="truncate">{overview.headRef}</span>
            <IconArrowRight className="size-3 shrink-0" />
            <span className="truncate">{overview.baseRef}</span>
          </span>

          <span className="flex items-center gap-1.5 text-muted-foreground">
            {overview.authorAvatarUrl ? (
              <img
                src={overview.authorAvatarUrl}
                alt=""
                className="size-4 rounded-full"
              />
            ) : null}
            <span className="font-medium text-foreground">
              {overview.authorLogin ?? "unknown"}
            </span>
            opened{" "}
            <RelativeDateTime at={new Date(overview.createdAt).getTime()} />
          </span>

          <a
            href={overview.htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <IconExternalLink className="size-3" />
            GitHub
          </a>
        </div>

        {overview.labels.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {overview.labels.map((label) => (
              <span
                key={label.name}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs text-foreground"
              >
                {/* Label colours come from GitHub as data, so they cannot be
                    theme tokens; keep them to a dot so contrast stays safe. */}
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: `#${label.color}` }}
                />
                {label.name}
              </span>
            ))}
          </div>
        ) : null}

        <div className="grid grid-cols-2 divide-x divide-y divide-border overflow-hidden rounded-md border border-border sm:grid-cols-4 sm:divide-y-0">
          <Stat label="Files" value={String(overview.changedFiles)} />
          <Stat label="Commits" value={String(overview.commitCount)} />
          <Stat
            label="Added"
            value={`+${overview.additions}`}
            className="text-emerald-600 dark:text-emerald-400"
          />
          <Stat
            label="Removed"
            value={`−${overview.deletions}`}
            className="text-destructive"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Total lines changed</span>
            <span className="tabular-nums text-foreground">{totalLoc}</span>
          </div>
          <div className="flex h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="bg-emerald-500"
              style={{ width: `${addedShare}%` }}
            />
            <div
              className="bg-destructive"
              style={{ width: `${100 - addedShare}%` }}
            />
          </div>
        </div>
      </div>
    </OverviewCard>
  );
}
