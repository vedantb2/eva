"use client";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Badge,
  ActivityTasks,
  formatElapsed,
} from "@conductor/ui";
import { parseActivitySteps } from "@conductor/shared/parseActivitySteps";
import { formatDuration } from "@conductor/shared/duration";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import { AuditResults } from "./AuditResults";
import { EvaIcon } from "@/lib/components/EvaIcon";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@conductor/backend";

type Audit = NonNullable<
  FunctionReturnType<typeof api.audits.listByTask>
>[number];
type Streaming = FunctionReturnType<typeof api.streaming.get>;

/** Passed/total result count across all sections of a completed audit. */
function auditScore(audit: Audit): { passed: number; total: number } {
  const passed = audit.sections.reduce(
    (sum, s) => sum + s.results.filter((r) => r.passed).length,
    0,
  );
  const total = audit.sections.reduce((sum, s) => sum + s.results.length, 0);
  return { passed, total };
}

function auditTitle(audit: Audit): string {
  if (audit.status === "running") return "Eva is performing audit";
  if (audit.status === "error") return "Audit failed";
  if (audit.fixStatus === "fixing") return "Eva is fixing audit issues";
  if (audit.fixStatus === "fix_error") return "Audit fix failed";
  if (audit.fixStatus === "fix_completed") return "Eva fixed audit issues";
  return "Eva performed audit";
}

/**
 * Top-level audit event on the activity timeline — own accordion on the shared
 * rail. Streaming/elapsed only applies to the latest audit, gated by `isLatest`.
 */
export function AuditTimelineItem({
  audit,
  isLatest,
  auditStreaming,
  auditElapsed,
  fixElapsed,
}: {
  audit: Audit;
  isLatest: boolean;
  auditStreaming: Streaming | undefined;
  auditElapsed: number;
  fixElapsed: number;
}) {
  const isAuditStreaming = isLatest && audit.status === "running";
  const isFixStreaming = isLatest && audit.fixStatus === "fixing";
  const score = audit.status === "completed" ? auditScore(audit) : null;

  const durationLabel = isFixStreaming
    ? formatElapsed(fixElapsed)
    : isAuditStreaming
      ? formatElapsed(auditElapsed)
      : audit.completedAt
        ? formatDuration(audit.createdAt, audit.completedAt)
        : null;

  return (
    <Accordion
      type="multiple"
      defaultValue={isAuditStreaming || isFixStreaming ? [audit._id] : []}
    >
      <AccordionItem value={audit._id} className="border-none">
        {/* Icon sits only beside the trigger so it stays top-aligned when open. */}
        <div className="flex gap-2">
          <div className="relative z-10 flex w-4 shrink-0 items-start justify-center bg-background pt-1.5">
            <EvaIcon size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <AccordionTrigger className="py-1.5">
              <div className="mr-2 flex min-w-0 flex-1 items-center justify-between gap-3">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-foreground">
                    {auditTitle(audit)}
                  </span>
                  {score ? (
                    <Badge
                      variant={
                        score.passed === score.total ? "success" : "warning"
                      }
                    >
                      {score.passed}/{score.total}
                    </Badge>
                  ) : null}
                  <span className="text-muted-foreground/50" aria-hidden>
                    ·
                  </span>
                  <RelativeDateTime
                    at={audit.createdAt}
                    className="shrink-0 text-xs"
                  />
                </div>
                {durationLabel ? (
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {durationLabel}
                  </span>
                ) : null}
              </div>
            </AccordionTrigger>
          </div>
        </div>
        <AccordionContent>
          <div className="ml-6 space-y-2 pb-2">
            {isAuditStreaming &&
              auditStreaming?.currentActivity &&
              (() => {
                const steps = parseActivitySteps(
                  auditStreaming.currentActivity,
                );
                return steps ? (
                  <ActivityTasks steps={steps} isStreaming name="Auditing" />
                ) : null;
              })()}
            {isFixStreaming &&
              auditStreaming?.currentActivity &&
              (() => {
                const steps = parseActivitySteps(
                  auditStreaming.currentActivity,
                );
                return steps ? (
                  <ActivityTasks steps={steps} isStreaming name="Fixing" />
                ) : null;
              })()}
            {audit.status === "error" ? (
              <p className="text-sm text-destructive">
                {audit.error ?? "Audit failed"}
              </p>
            ) : (
              <AuditResults auditData={audit} />
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
