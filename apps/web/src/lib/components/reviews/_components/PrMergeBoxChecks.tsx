"use client";

import { useState } from "react";
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@eva/ui";
import { checksHeadline, checksOverallTone, countChecks } from "./prMergeState";
import { PrCheckRow } from "./PrCheckRow";
import { ToneIcon, type PrCheck } from "./prOverviewMeta";

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

  // Nothing has reported: the tab row's checks pill is already absent for the same
  // reason, and a line saying so is a line about nothing.
  if (checks.length === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-2">
        <ToneIcon tone={checksOverallTone(counts)} size={15} />
        <span className="min-w-0 flex-1 truncate text-sm">
          {checksHeadline(counts)}
        </span>
        <CollapsibleTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-1.5 text-xs text-muted-foreground"
          >
            {open ? "Hide" : "Show"} all
          </Button>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent>
        <ul className="mt-1.5 max-h-64 space-y-0.5 overflow-y-auto rounded-md bg-muted/40 p-1.5 scrollbar scroll-fade">
          {checks.map((check) => (
            <li key={`${check.kind}-${check.name}`}>
              <PrCheckRow check={check} />
            </li>
          ))}
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
