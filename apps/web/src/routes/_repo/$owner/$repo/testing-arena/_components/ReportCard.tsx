import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@eva/backend";
import type { FunctionReturnType } from "convex/server";
import {
  ActivityTasks,
  Button,
  Spinner,
  TestError,
  TestErrorMessage,
} from "@eva/ui";
import {
  IconAlertTriangle,
  IconGitPullRequest,
  IconTool,
} from "@tabler/icons-react";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import { parseActivitySteps } from "@eva/shared/parseActivitySteps";
import { IssuesList } from "./IssuesList";

export type EvaluationReport = FunctionReturnType<
  typeof api.evaluationReports.listByDoc
>[number];

/**
 * Detail pane for a single evaluation report: running/error states, the
 * issue count with fix actions, streamed activity while a fix runs, and the
 * issues list.
 */
export function ReportCard({
  report,
  streamingActivity,
}: {
  report: EvaluationReport;
  streamingActivity?: string;
}) {
  const startFix = useMutation(api.evaluationWorkflow.startFix);
  const [isStartingFix, setIsStartingFix] = useState(false);

  const issues = report.issues ?? [];

  const handleFix = async () => {
    setIsStartingFix(true);
    try {
      await startFix({ reportId: report._id });
    } catch (error) {
      setIsStartingFix(false);
      throw error;
    }
    setIsStartingFix(false);
  };

  if (report.status === "running") {
    const steps = parseActivitySteps(streamingActivity);
    return steps ? (
      <div className="px-1 py-3">
        <ActivityTasks steps={steps} isStreaming />
      </div>
    ) : (
      <div className="flex items-center gap-3 px-1 py-3">
        <Spinner size="sm" />
        <span className="text-sm text-muted-foreground truncate">
          {streamingActivity || "Reviewing codebase..."}
        </span>
      </div>
    );
  }

  if (report.status === "error" && report.error) {
    return (
      <TestError>
        <TestErrorMessage>{report.error}</TestErrorMessage>
      </TestError>
    );
  }

  if (report.status !== "completed") return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">
          {issues.length === 0
            ? "No issues found"
            : `${issues.length} issue${issues.length === 1 ? "" : "s"} found`}
        </span>
        <div className="flex items-center gap-2">
          {issues.length > 0 && report.fixStatus === undefined && (
            <Button size="sm" onClick={handleFix} disabled={isStartingFix}>
              <IconTool size={14} />
              {isStartingFix ? "Starting..." : "Fix issues"}
            </Button>
          )}
          {report.fixStatus === "fixing" && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Spinner size="sm" />
              Fixing issues...
            </span>
          )}
          {report.fixStatus === "fix_error" && (
            <>
              <span className="flex items-center gap-1.5 text-xs text-destructive">
                <IconAlertTriangle size={14} />
                Fix failed
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleFix}
                disabled={isStartingFix}
              >
                <IconTool size={14} />
                {isStartingFix ? "Starting..." : "Retry fix"}
              </Button>
            </>
          )}
          {report.prUrl && (
            <Button asChild variant="outline" size="sm">
              <a href={report.prUrl} target="_blank" rel="noopener noreferrer">
                <IconGitPullRequest size={14} />
                View Fix PR
              </a>
            </Button>
          )}
          <RelativeDateTime
            at={report.createdAt}
            className="text-sm text-muted-foreground"
          />
        </div>
      </div>

      {report.fixStatus === "fixing" &&
        (() => {
          const fixSteps = parseActivitySteps(streamingActivity);
          return fixSteps ? (
            <div className="rounded-surface border border-primary/20 bg-primary/5 px-4 py-3">
              <div className="flex items-center gap-1.5 mb-2">
                <IconTool size={14} className="text-primary shrink-0" />
                <span className="text-xs font-medium text-primary">
                  Fixing issues...
                </span>
              </div>
              <ActivityTasks steps={fixSteps} isStreaming />
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-surface border border-primary/20 bg-primary/5 px-3 py-2">
              <IconTool size={14} className="text-primary shrink-0" />
              <span className="text-sm text-primary">
                {streamingActivity ||
                  "Eva is fixing the flagged issues and will create a PR automatically..."}
              </span>
            </div>
          );
        })()}

      {report.summary && (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {report.summary}
        </p>
      )}

      <IssuesList report={report} />
    </div>
  );
}
