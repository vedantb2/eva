"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@conductor/backend";
import {
  Badge,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Checkbox,
  Button,
  Spinner,
  cn,
} from "@conductor/ui";
import { IconCheck } from "@tabler/icons-react";
import dayjs from "@conductor/shared/dates";

type AuditDoc = FunctionReturnType<typeof api.audits.listByTask>[number];
type AuditSeverity = "critical" | "high" | "medium" | "low";

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

const SEVERITY_COLORS: Record<AuditSeverity, string> = {
  critical: "bg-red-500/15 text-red-700 dark:text-red-400",
  high: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  medium: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  low: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
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

interface AuditSectionProps {
  latestAudit: AuditDoc | null;
  pastAudits: FunctionReturnType<typeof api.audits.listByTask>;
}

function AuditResults({ auditData }: { auditData: AuditDoc }) {
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
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="space-y-3">
      <Badge
        variant={
          auditData.status === "completed"
            ? "success"
            : auditData.status === "error"
              ? "destructive"
              : "warning"
        }
      >
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
            {auditData.sections
              .filter((section) => section.results.length > 0)
              .map((section) => (
                <AccordionItem
                  key={section.name}
                  value={section.name}
                  className="rounded-lg bg-muted/40 px-3"
                >
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{section.name}</span>
                      <Badge
                        variant={
                          section.results.every((i) => i.passed)
                            ? "success"
                            : "destructive"
                        }
                      >
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
                              <SeverityBadge severity={severity} />
                            ) : (
                              <Checkbox
                                checked={selected.has(key)}
                                onCheckedChange={() => toggleFailure(failure)}
                                className="mt-0.5 flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                {!item.passed && !isFixing && (
                                  <SeverityBadge severity={severity} />
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
                </AccordionItem>
              ))}
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
            <Badge variant="success" className="mt-3">
              Fixed audit issues
            </Badge>
          )}
          {auditData.fixStatus === "fix_error" && (
            <Badge variant="destructive" className="mt-3">
              Fix failed
            </Badge>
          )}
        </>
      )}
    </div>
  );
}

function SeverityBadge({ severity }: { severity: AuditSeverity }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium shrink-0",
        SEVERITY_COLORS[severity],
      )}
    >
      {severity}
    </span>
  );
}

export function AuditSection({ latestAudit, pastAudits }: AuditSectionProps) {
  const [showPastAudits, setShowPastAudits] = useState(false);

  if (!latestAudit) {
    return <p className="text-sm text-muted-foreground">No audit available</p>;
  }

  return (
    <div className="space-y-4">
      <AuditResults auditData={latestAudit} />
      {pastAudits.length > 0 && (
        <div>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowPastAudits((v) => !v)}
          >
            {showPastAudits ? "Hide" : "Show"} past audits ({pastAudits.length})
          </button>
          {showPastAudits && (
            <div className="mt-6 space-y-4">
              {pastAudits.map((pastAudit) => (
                <div key={pastAudit._id} className="space-y-2">
                  <span className="text-xs text-muted-foreground">
                    {dayjs(pastAudit.createdAt).format("DD/MM/YYYY HH:mm")}
                  </span>
                  <AuditResults auditData={pastAudit} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
