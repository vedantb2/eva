"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@eva/backend";
import {
  Badge,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Checkbox,
  Button,
  Spinner,
  StatusDot,
  type StatusTone,
  cn,
} from "@eva/ui";
import { IconCheck } from "@tabler/icons-react";

type AuditDoc = FunctionReturnType<typeof api.audits.listByTask>[number];
// Derived from the Convex validator (`auditSeverityValidator`) rather than
// restated as a literal union, so a new severity added to the schema shows up
// here as a type error instead of silently falling through.
type AuditSeverity = NonNullable<
  AuditDoc["sections"][number]["results"][number]["severity"]
>;

type AuditFailure = {
  section: string;
  requirement: string;
  detail: string;
  severity: AuditSeverity;
};

const SEVERITY_ORDER: Record<AuditSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

/**
 * `StatusDot` tone per audit-result severity — a small glyph beside neutral
 * text rather than a loud filled pill.
 *
 * `high` and `medium` borrow the workflow ramp's orange and yellow. Those are
 * the app's only two mid-warm steps, and adding severity-specific ones would
 * invent a new tone step, which the colour ladder forbids.
 *
 * Local to this file on purpose — `automations/_utils.ts` and
 * `testing-arena/IssuesList.tsx` each have their own copy for their own
 * severity scale. The values match today, but the three are conceptually
 * distinct features and sharing four lines would couple them.
 */
const SEVERITY_TONE: Record<AuditSeverity, StatusTone> = {
  critical: "critical",
  high: "business-review",
  medium: "progress",
  low: "neutral",
};

/** `StatusDot` tone per audit run status. `pending` and `running` share a
 * tone — neither is "done" or "error" yet, and the badge text still shows the
 * literal status string, so the two stay distinguishable by label. */
const AUDIT_STATUS_TONE: Record<AuditDoc["status"], StatusTone> = {
  pending: "progress",
  running: "progress",
  completed: "done",
  error: "critical",
};

function failureKey(f: AuditFailure): string {
  return `${f.section}::${f.requirement}`;
}

function extractFailures(audit: AuditDoc): AuditFailure[] {
  const failures: AuditFailure[] = [];
  for (const section of audit.sections) {
    for (const result of section.results) {
      if (!result.passed) {
        failures.push({
          section: section.name,
          requirement: result.requirement,
          detail: result.detail,
          severity: result.severity ?? "medium",
        });
      }
    }
  }
  return failures.sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );
}

function sortedResults(
  results: AuditDoc["sections"][number]["results"],
): AuditDoc["sections"][number]["results"] {
  return [...results].sort((a, b) => {
    if (a.passed !== b.passed) return a.passed ? 1 : -1;
    const sevA = SEVERITY_ORDER[a.severity ?? "medium"];
    const sevB = SEVERITY_ORDER[b.severity ?? "medium"];
    return sevA - sevB;
  });
}

/**
 * Renders a single audit's outcome: status/summary, per-section pass/fail
 * accordions with severities, and the interactive "Run Fixes" flow. Shared by
 * the nested audit row under a run in the activity timeline.
 */
export function AuditResults({ auditData }: { auditData: AuditDoc }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isRunning, setIsRunning] = useState(false);
  const runFixes = useMutation(api.audits.runSelectedFixes);

  const failures = extractFailures(auditData);
  const isFixing = auditData.fixStatus === "fixing";
  const allSelected =
    failures.length > 0 && failures.every((f) => selected.has(failureKey(f)));

  function toggleFailure(f: AuditFailure) {
    const key = failureKey(f);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(failures.map(failureKey)));
    }
  }

  async function handleRunFixes() {
    if (selected.size === 0) return;
    setIsRunning(true);
    try {
      const selectedFailures = failures.filter((f) =>
        selected.has(failureKey(f)),
      );
      await runFixes({ auditId: auditData._id, selectedFailures });
      setSelected(new Set());
    } catch (error) {
      setIsRunning(false);
      throw error;
    }
    setIsRunning(false);
  }

  return (
    <div className="space-y-3">
      <Badge variant="quiet" className="gap-1.5">
        <StatusDot tone={AUDIT_STATUS_TONE[auditData.status]} />
        {auditData.status}
      </Badge>
      {auditData.status === "error" && auditData.error && (
        <div className="p-2 bg-destructive/10 rounded text-sm text-destructive">
          {auditData.error}
        </div>
      )}
      {auditData.status === "completed" && (
        <>
          {auditData.summary && (
            <p className="text-sm text-muted-foreground mb-3">
              {auditData.summary}
            </p>
          )}

          {failures.length > 0 && !isFixing && (
            <div className="flex items-center gap-2 pb-1">
              <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
              <span className="text-xs text-muted-foreground">
                Select all failures ({failures.length})
              </span>
            </div>
          )}

          <Accordion type="multiple" className="space-y-2">
            {auditData.sections.flatMap((section) =>
              section.results.length === 0
                ? []
                : [
                    <AccordionItem
                      key={section.name}
                      value={section.name}
                      className="rounded-surface border border-border bg-card px-3"
                    >
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{section.name}</span>
                          <Badge variant="quiet" className="gap-1.5">
                            <StatusDot
                              tone={
                                section.results.every((i) => i.passed)
                                  ? "done"
                                  : "critical"
                              }
                            />
                            {section.results.filter((i) => i.passed).length}/
                            {section.results.length}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          {sortedResults(section.results).map((item, i) => {
                            const severity: AuditSeverity =
                              item.severity ?? "medium";
                            const failure: AuditFailure = {
                              section: section.name,
                              requirement: item.requirement,
                              detail: item.detail,
                              severity,
                            };
                            const key = failureKey(failure);
                            return (
                              <div
                                key={i}
                                className="flex items-start gap-2 text-sm"
                              >
                                {item.passed ? (
                                  <IconCheck
                                    size={16}
                                    className="text-success mt-0.5 flex-shrink-0"
                                  />
                                ) : isFixing ? (
                                  <SeverityGlyph
                                    severity={severity}
                                    className="mt-0.5"
                                  />
                                ) : (
                                  <Checkbox
                                    checked={selected.has(key)}
                                    onCheckedChange={() =>
                                      toggleFailure(failure)
                                    }
                                    className="mt-0.5 flex-shrink-0"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    {!item.passed && !isFixing && (
                                      <SeverityGlyph severity={severity} />
                                    )}
                                    <span className="font-medium">
                                      {item.requirement}
                                    </span>
                                  </div>
                                  <p className="text-muted-foreground">
                                    {item.detail}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>,
                  ],
            )}
          </Accordion>

          {failures.length > 0 && !isFixing && (
            <div className="pt-2">
              <Button
                size="sm"
                disabled={selected.size === 0 || isRunning}
                onClick={handleRunFixes}
              >
                {isRunning && <Spinner size="sm" />}
                Run Fixes ({selected.size})
              </Button>
            </div>
          )}

          {isFixing && (
            <div className="flex items-center gap-2 mt-3">
              <Spinner size="sm" />
              <span className="text-sm text-muted-foreground">
                Fixing audit issues...
              </span>
            </div>
          )}
          {auditData.fixStatus === "fix_completed" && (
            <Badge variant="quiet" className="mt-3 gap-1.5">
              <StatusDot tone="done" />
              Fixed audit issues
            </Badge>
          )}
          {auditData.fixStatus === "fix_error" && (
            <Badge variant="quiet" className="mt-3 gap-1.5">
              <StatusDot tone="critical" />
              Fix failed
            </Badge>
          )}
        </>
      )}
    </div>
  );
}

/** Quiet severity glyph: a `StatusDot` plus neutral text, not a filled pill. */
function SeverityGlyph({
  severity,
  className,
}: {
  severity: AuditSeverity;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex shrink-0 items-center gap-1.5", className)}
    >
      <StatusDot tone={SEVERITY_TONE[severity]} />
      <span className="text-2xs text-muted-foreground">{severity}</span>
    </span>
  );
}
