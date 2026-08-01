import { IconExternalLink } from "@tabler/icons-react";
import { OverviewCard } from "./OverviewCard";
import { checkTone, ToneIcon, type PrCheck } from "./prOverviewMeta";

/**
 * CI check runs and commit statuses in one list, matching GitHub's own merge
 * box. Review bots (and Eva's own agents) report through either API, so both
 * are shown together with the reporter's summary line.
 */
export function PrChecksCard({
  checks,
  truncated,
}: {
  checks: PrCheck[];
  truncated: boolean;
}) {
  const counts = { success: 0, failure: 0, pending: 0, neutral: 0 };
  for (const check of checks) {
    counts[checkTone(check)] += 1;
  }

  const summary = [
    counts.failure > 0 ? `${counts.failure} failing` : null,
    counts.pending > 0 ? `${counts.pending} running` : null,
    counts.success > 0 ? `${counts.success} passing` : null,
    counts.neutral > 0 ? `${counts.neutral} skipped` : null,
  ]
    .filter((part) => part !== null)
    .join(" · ");

  return (
    <OverviewCard
      title="Checks"
      count={checks.length}
      action={
        summary ? (
          <span className="truncate text-xs text-muted-foreground">
            {summary}
          </span>
        ) : null
      }
      footer={
        truncated ? `Showing the first ${checks.length} checks` : undefined
      }
    >
      {checks.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No checks have reported yet.
        </p>
      ) : (
        <ul className="max-h-72 space-y-0.5 overflow-y-auto scrollbar scroll-fade">
          {checks.map((check) => {
            const row = (
              <span className="flex min-w-0 items-center gap-2">
                <ToneIcon tone={checkTone(check)} />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {check.name}
                </span>
                {check.description ? (
                  <span className="hidden min-w-0 max-w-[45%] truncate text-xs text-muted-foreground sm:block">
                    {check.description}
                  </span>
                ) : null}
                {check.htmlUrl ? (
                  <IconExternalLink className="size-3 shrink-0 text-muted-foreground" />
                ) : null}
              </span>
            );
            return (
              <li key={`${check.kind}-${check.name}`}>
                {check.htmlUrl ? (
                  <a
                    href={check.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-md px-1.5 py-1 hover:bg-muted/60"
                  >
                    {row}
                  </a>
                ) : (
                  <div className="px-1.5 py-1">{row}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </OverviewCard>
  );
}
