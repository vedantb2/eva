import { useState } from "react";
import { EmptyState, Spinner } from "@eva/ui";
import { IconFlask } from "@tabler/icons-react";
import { ReportCard, type EvaluationReport } from "./ReportCard";
import { RunListItem } from "./RunListItem";

/**
 * Master/detail split for a doc's test runs: a dense run list on the left,
 * the selected run's report on the right. Falls back to the most recent
 * running (or otherwise first) run when nothing is explicitly selected.
 */
export function CodeTestingContent({
  reports,
  streamingActivity,
}: {
  reports: EvaluationReport[] | undefined;
  streamingActivity?: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeId =
    selectedId ??
    reports?.find((r) => r.status === "running")?._id ??
    reports?.[0]?._id ??
    null;
  const activeReport = reports?.find((r) => r._id === activeId);

  if (reports === undefined) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center">
        <EmptyState
          icon={<IconFlask size={20} className="text-muted-foreground" />}
          title="No test runs yet"
          description='Click "Run Test" to evaluate this doc'
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden sm:flex-row">
      <div className="scrollbar max-h-32 w-full shrink-0 space-y-1 overflow-y-auto border-b p-2 sm:max-h-none sm:w-56 sm:border-b-0 sm:border-r">
        <p className="px-2 py-1 text-2xs font-medium text-muted-foreground">
          Test runs ({reports.length})
        </p>
        {reports.map((report) => (
          <RunListItem
            key={report._id}
            report={report}
            isActive={report._id === activeId}
            onClick={() => setSelectedId(report._id)}
          />
        ))}
      </div>

      <div className="scrollbar flex-1 overflow-y-auto p-4">
        {activeReport && (
          <ReportCard
            report={activeReport}
            streamingActivity={
              activeReport.status === "running" ||
              activeReport.fixStatus === "fixing"
                ? streamingActivity
                : undefined
            }
          />
        )}
      </div>
    </div>
  );
}
