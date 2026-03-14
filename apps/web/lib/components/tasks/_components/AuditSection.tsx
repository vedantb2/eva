"use client";

import { useState } from "react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@conductor/backend";
import {
  Badge,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@conductor/ui";
import { IconCheck, IconAlertTriangle } from "@tabler/icons-react";
import dayjs from "@conductor/shared/dates";

type AuditDoc = FunctionReturnType<typeof api.audits.listByTask>[number];

interface AuditSectionProps {
  latestAudit: AuditDoc | null;
  pastAudits: FunctionReturnType<typeof api.audits.listByTask>;
}

function AuditResults({ auditData }: { auditData: AuditDoc }) {
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
          <Accordion type="multiple" className="space-y-2">
            {auditData.sections
              .filter((section) => section.results.length > 0)
              .map((section) => (
                <AccordionItem
                  key={section.name}
                  value={section.name}
                  className="border rounded-lg px-3"
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
                      {section.results.map((item, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          {item.passed ? (
                            <IconCheck
                              size={16}
                              className="text-success mt-0.5 flex-shrink-0"
                            />
                          ) : (
                            <IconAlertTriangle
                              size={16}
                              className="text-destructive mt-0.5 flex-shrink-0"
                            />
                          )}
                          <div>
                            <span className="font-medium">
                              {item.requirement}
                            </span>
                            <p className="text-muted-foreground">
                              {item.detail}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
          </Accordion>
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
            <div className="mt-3 space-y-4 border-t pt-3">
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
