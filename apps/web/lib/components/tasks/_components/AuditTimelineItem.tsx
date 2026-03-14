"use client";

import { Fragment } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Badge,
  ActivitySteps,
  formatElapsed,
} from "@conductor/ui";
import dayjs from "@conductor/shared/dates";
import { parseActivitySteps } from "@/lib/utils/parseActivitySteps";
import { formatDuration } from "@/lib/utils/formatDuration";
import { AuditActivityLog } from "../AuditActivityLog";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@conductor/backend";

type Audit = NonNullable<
  FunctionReturnType<typeof api.audits.listByTask>
>[number];
type Streaming = FunctionReturnType<typeof api.streaming.get>;

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

  return (
    <Fragment>
      {audit.fixStatus && (
        <Accordion
          type="multiple"
          defaultValue={isFixStreaming ? [`fix-${audit._id}`] : []}
        >
          <AccordionItem
            value={`fix-${audit._id}`}
            className="rounded-lg bg-muted/40 px-3"
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
                      <ActivitySteps steps={steps} isStreaming name="Fixing" />
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
        defaultValue={isAuditStreaming ? [`audit-${audit._id}`] : []}
      >
        <AccordionItem
          value={`audit-${audit._id}`}
          className="rounded-lg bg-muted/40 px-3"
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
                      <Badge variant={passed === total ? "success" : "warning"}>
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
                    <ActivitySteps steps={steps} isStreaming name="Auditing" />
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
    </Fragment>
  );
}
