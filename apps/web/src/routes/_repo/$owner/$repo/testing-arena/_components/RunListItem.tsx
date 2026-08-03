import { ListRow, Spinner } from "@eva/ui";
import {
  IconAlertTriangle,
  IconCheck,
  IconGitPullRequest,
} from "@tabler/icons-react";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import type { EvaluationReport } from "./ReportCard";

/**
 * One row in the run list sidebar — a dense, selectable list row rather than
 * a hand-rolled button, so it gets the shared selected/hover/focus styling.
 */
export function RunListItem({
  report,
  isActive,
  onClick,
}: {
  report: EvaluationReport;
  isActive: boolean;
  onClick: () => void;
}) {
  const issueCount = (report.issues ?? []).length;
  const label =
    report.status === "completed"
      ? issueCount === 0
        ? "No issues"
        : `${issueCount} issue${issueCount === 1 ? "" : "s"}`
      : report.status === "error"
        ? "Error"
        : "Running...";

  return (
    <ListRow
      density="compact"
      selected={isActive}
      onClick={onClick}
      aria-label={label}
      contentClassName="flex items-center gap-2.5"
    >
      {report.status === "completed" && (
        <>
          {issueCount === 0 ? (
            <IconCheck size={14} className="shrink-0 text-success" />
          ) : report.prUrl ? (
            <IconGitPullRequest size={14} className="shrink-0 text-primary" />
          ) : (
            <IconAlertTriangle
              size={14}
              className="shrink-0 text-destructive"
            />
          )}
          <div className="flex min-w-0 flex-col">
            <span className="text-2sm tabular-nums">{label}</span>
            <span className="text-2xs text-muted-foreground">
              <RelativeDateTime at={report.createdAt} />
              {report.fixStatus === "fixing" && " · Fixing..."}
              {report.prUrl && " · PR created"}
            </span>
          </div>
        </>
      )}
      {report.status === "error" && (
        <>
          <IconAlertTriangle size={14} className="shrink-0 text-destructive" />
          <div className="flex min-w-0 flex-col">
            <span className="text-2sm text-destructive">Error</span>
            <RelativeDateTime
              at={report.createdAt}
              className="text-2xs text-muted-foreground"
            />
          </div>
        </>
      )}
      {/* `pending` (queued) shares the running presentation — the header's Run
          button and this row's aria-label already treat the two as one state,
          and a status with no branch of its own would render an empty row. */}
      {(report.status === "running" || report.status === "pending") && (
        <>
          <Spinner size="sm" />
          <div className="flex min-w-0 flex-col">
            <span className="text-2sm text-muted-foreground">
              Running...
            </span>
            <RelativeDateTime
              at={report.createdAt}
              className="text-2xs text-muted-foreground"
            />
          </div>
        </>
      )}
    </ListRow>
  );
}
