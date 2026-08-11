"use client";

import { useState } from "react";
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@eva/ui";
import { IconExternalLink } from "@tabler/icons-react";
import { checksHeadline, checksOverallTone, countChecks } from "./prMergeState";
import { checkTone, ToneIcon, type PrCheck } from "./prOverviewMeta";

/**
 * The checks row of the merge box: a single verdict line, with the full list of
 * check runs and commit statuses a click away. Review bots report through either
 * API, so both appear here together, as they do on GitHub.
 */
export function PrMergeBoxChecks({
  checks,
  truncated,
}: {
  checks: PrCheck[];
  truncated: boolean;
}) {
  const [open, setOpen] = useState(false);
  const counts = countChecks(checks);

  if (checks.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground">
        <ToneIcon tone="neutral" size={16} />
        No checks have reported yet.
      </div>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-2 px-3 py-2">
        <ToneIcon tone={checksOverallTone(counts)} size={16} />
        <span className="min-w-0 flex-1 truncate text-sm">
          {checksHeadline(counts)}
        </span>
        <CollapsibleTrigger asChild>
          <Button size="sm" variant="ghost" className="text-muted-foreground">
            {open ? "Hide" : "Show"} all checks
          </Button>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent>
        <ul className="max-h-64 space-y-0.5 overflow-y-auto border-t border-border px-2 py-1.5 scrollbar scroll-fade">
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
                  <IconExternalLink
                    size={12}
                    className="shrink-0 text-muted-foreground"
                    aria-hidden
                  />
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
          {truncated ? (
            <li className="px-1.5 py-1 text-xs text-muted-foreground">
              Only the first {checks.length} checks are shown.
            </li>
          ) : null}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}
