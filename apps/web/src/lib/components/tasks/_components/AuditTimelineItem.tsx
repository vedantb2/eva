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
import dayjs from "@conductor/shared/dates";
import { parseActivitySteps } from "@conductor/shared/parseActivitySteps";
import { formatDuration } from "@conductor/shared/duration";
import { AuditActivityLog } from "../AuditActivityLog";
import { AuditResults } from "./AuditResults";
import { RunRailEvaIcon } from "./ProofTimelineItem";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@conductor/backend";

type Audit = NonNullable<
  FunctionReturnType<typeof api.audits.listByTask>
>[number];
type Streaming = FunctionReturnType<typeof api.streaming.get>;

export function AuditTimelineItem({
  audit,
  isLatest,
  isFirst,
  auditStreaming,
  auditElapsed,
  fixElapsed,
}: {
  audit: Audit;
  isLatest: boolean;
  isFirst: boolean;
  auditStreaming: Streaming | undefined;
  auditElapsed: number;
  fixElapsed: number;
}) {
  const isAuditStreaming = isLatest && audit.status === "running";
  const isFixStreaming = isLatest && audit.fixStatus === "fixing";

  return (
    <div className="flex gap-2">
      <div className="relative z-10 pt-3">
        <RunRailEvaIcon />
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        {audit.fixStatus && (
          <Accordion
            type="multiple"
            defaultValue={isFixStreaming || isFirst ? [`fix-${audit._id}`] : []}
          >
            <AccordionItem
              value={`fix-${audit._id}`}
              className="rounded-surface border border-border bg-card px-3"
            >
              <AccordionTrigger>
                <div className="flex flex-1 items-center justify-between mr-2 min-w-0 gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <Badge
                      variant={
                        audit.fixStatus === "fixing"
                          ? "warning"
                          : audit.fixStatus === "fix_error"
                            ? "destructive"
                            : "success"
                      }
                    >
                      {audit.fixStatus === "fixing"
                        ? "fixing audit issues"
                        : audit.fixStatus === "fix_error"
                          ? "fix error"
                          : "fixed audit issues"}
                    </Badge>
                    <span className="text-xs text-muted-foreground truncate">
                      {dayjs(audit.createdAt).format("DD/MM/YYYY HH:mm")}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {isFixStreaming
                      ? formatElapsed(fixElapsed)
                      : audit.fixCompletedAt
                        ? formatDuration(audit.createdAt, audit.fixCompletedAt)
                        : null}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {isFixStreaming &&
                    auditStreaming?.currentActivity &&
                    (() => {
                      const steps = parseActivitySteps(
                        auditStreaming.currentActivity,
                      );
                      return steps ? (
                        <ActivityTasks
                          steps={steps}
                          isStreaming
                          name="Fixing"
                        />
                      ) : null;
                    })()}
                  {!isFixStreaming && audit.runId && (
                    <AuditActivityLog runId={audit.runId} type="fix" />
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
        <Accordion
          type="multiple"
          defaultValue={
            isAuditStreaming || isFirst ? [`audit-${audit._id}`] : []
          }
        >
          <AccordionItem
            value={`audit-${audit._id}`}
            className="rounded-surface border border-border bg-card px-3"
          >
            <AccordionTrigger>
              <div className="flex flex-1 items-center justify-between mr-2 min-w-0 gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-wrap">
                  <Badge
                    variant={
                      audit.status === "running"
                        ? "warning"
                        : audit.status === "error"
                          ? "destructive"
                          : "success"
                    }
                  >
                    {audit.status === "running"
                      ? "auditing"
                      : audit.status === "error"
                        ? "audit error"
                        : "audited"}
                  </Badge>
                  <span className="text-xs text-muted-foreground truncate">
                    {dayjs(audit.createdAt).format("DD/MM/YYYY HH:mm")}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {audit.status === "completed" &&
                    audit.sections.length > 0 &&
                    (() => {
                      const passed = audit.sections.reduce(
                        (sum, s) =>
                          sum + s.results.filter((r) => r.passed).length,
                        0,
                      );
                      const total = audit.sections.reduce(
                        (sum, s) => sum + s.results.length,
                        0,
                      );
                      return (
                        <Badge
                          variant={passed === total ? "success" : "warning"}
                        >
                          {passed}/{total}
                        </Badge>
                      );
                    })()}
                  <span className="text-xs text-muted-foreground">
                    {isAuditStreaming
                      ? formatElapsed(auditElapsed)
                      : audit.completedAt
                        ? formatDuration(audit.createdAt, audit.completedAt)
                        : null}
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {isAuditStreaming &&
                  auditStreaming?.currentActivity &&
                  (() => {
                    const steps = parseActivitySteps(
                      auditStreaming.currentActivity,
                    );
                    return steps ? (
                      <ActivityTasks
                        steps={steps}
                        isStreaming
                        name="Auditing"
                      />
                    ) : null;
                  })()}
                {!isAuditStreaming && audit.runId && (
                  <AuditActivityLog runId={audit.runId} type="audit" />
                )}
                {audit.status === "error" && (
                  <p className="text-sm text-destructive">
                    {audit.error ?? "Audit failed"}
                  </p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}

/** Passed/total result count across all sections of a completed audit. */
function auditScore(audit: Audit): { passed: number; total: number } {
  const passed = audit.sections.reduce(
    (sum, s) => sum + s.results.filter((r) => r.passed).length,
    0,
  );
  const total = audit.sections.reduce((sum, s) => sum + s.results.length, 0);
  return { passed, total };
}

/**
 * Audit nested under its run — sibling timeline event (same rail as proof),
 * own accordion for expandable results / Run Fixes. Streaming/elapsed only
 * applies to the latest audit, gated by `isLatest`.
 */
export function RunAuditRow({
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
    <div className="flex gap-2">
      <RunRailEvaIcon />
      <div className="min-w-0 flex-1">
        <Accordion
          type="multiple"
          defaultValue={isAuditStreaming || isFixStreaming ? [audit._id] : []}
        >
          <AccordionItem value={audit._id} className="border-none">
            <AccordionTrigger className="py-1.5">
              <div className="mr-2 flex min-w-0 flex-1 items-center gap-2">
                <span className="text-xs font-medium text-foreground">
                  {audit.status === "running"
                    ? "Eva is auditing"
                    : audit.status === "error"
                      ? "Audit failed"
                      : "Eva completed audit"}
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
                {durationLabel ? (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {durationLabel}
                  </span>
                ) : null}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pb-2">
                {isAuditStreaming &&
                  auditStreaming?.currentActivity &&
                  (() => {
                    const steps = parseActivitySteps(
                      auditStreaming.currentActivity,
                    );
                    return steps ? (
                      <ActivityTasks
                        steps={steps}
                        isStreaming
                        name="Auditing"
                      />
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
                <AuditResults auditData={audit} />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
