import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryState } from "nuqs";
import { testingTabParser, branchParser } from "@/lib/search-params";
import { useQuery, useMutation } from "convex/react";
import { api } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import type { Id } from "@conductor/backend";
import {
  ActivitySteps,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  Spinner,
  TestResults,
  TestResultsHeader,
  TestResultsSummary,
  TestResultsProgress,
  TestResultsContent,
  TestSuite,
  TestSuiteName,
  TestSuiteContent,
  TestSuiteStats,
  Test,
  TestError,
  TestErrorMessage,
} from "@conductor/ui";
import {
  IconPlayerPlay,
  IconWorld,
  IconCode,
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconGitPullRequest,
  IconTool,
} from "@tabler/icons-react";
import dayjs from "@conductor/shared/dates";
import { UITestingPanel } from "./UITestingPanel";
import { parseActivitySteps } from "@/lib/utils/parseActivitySteps";
import { BranchSelect } from "@/lib/components/BranchSelect";

export const Route = createFileRoute("/_repo/$owner/$repo/testing-arena/$id")({
  component: TestingArenaDetailRoute,
});

interface EvalResult {
  requirement: string;
  passed: boolean;
  detail: string;
}

interface EvaluationReport {
  _id: Id<"evaluationReports">;
  status: "pending" | "running" | "completed" | "error";
  results: EvalResult[];
  summary?: string;
  error?: string;
  fixStatus?: "fixing" | "fix_completed" | "fix_error";
  fixBranchName?: string;
  prUrl?: string;
  createdAt: number;
}

function ReportCard({
  report,
  streamingActivity,
}: {
  report: EvaluationReport;
  streamingActivity?: string;
}) {
  const passed = report.results.filter((r) => r.passed);
  const failed = report.results.filter((r) => !r.passed);
  const total = report.results.length;

  const summary =
    total > 0
      ? { passed: passed.length, failed: failed.length, skipped: 0, total }
      : undefined;

  return (
    <TestResults summary={summary}>
      {report.status === "running" &&
        (() => {
          const steps = parseActivitySteps(streamingActivity);
          return steps ? (
            <div className="px-4 py-3">
              <ActivitySteps steps={steps} isStreaming />
            </div>
          ) : (
            <div className="flex items-center gap-3 px-4 py-3">
              <Spinner size="sm" />
              <span className="text-sm text-muted-foreground truncate">
                {streamingActivity || "Evaluating codebase..."}
              </span>
            </div>
          );
        })()}

      {report.status === "error" && report.error && (
        <div className="p-4">
          <TestError>
            <TestErrorMessage>{report.error}</TestErrorMessage>
          </TestError>
        </div>
      )}

      {report.status === "completed" && (
        <>
          <TestResultsHeader>
            <TestResultsSummary />
            <div className="flex items-center gap-2">
              {report.fixStatus === "fixing" && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Spinner size="sm" />
                  Fixing issues...
                </span>
              )}
              {report.fixStatus === "fix_error" && (
                <span className="flex items-center gap-1.5 text-xs text-destructive">
                  <IconAlertTriangle size={14} />
                  Fix failed
                </span>
              )}
              {report.prUrl && (
                <a
                  href={report.prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/5 transition-colors"
                >
                  <IconGitPullRequest size={14} />
                  View Fix PR
                </a>
              )}
              <span className="text-sm text-muted-foreground">
                {dayjs(report.createdAt).fromNow()}
              </span>
            </div>
          </TestResultsHeader>

          <TestResultsContent>
            <TestResultsProgress />

            {report.fixStatus === "fixing" &&
              (() => {
                const fixSteps = parseActivitySteps(streamingActivity);
                return fixSteps ? (
                  <div className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <IconTool size={14} className="text-primary shrink-0" />
                      <span className="text-xs font-medium text-primary">
                        Fixing issues...
                      </span>
                    </div>
                    <ActivitySteps steps={fixSteps} isStreaming />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2">
                    <IconTool size={14} className="text-primary shrink-0" />
                    <span className="text-sm text-primary">
                      {streamingActivity ||
                        "Eva is fixing the failing requirements and will create a PR automatically..."}
                    </span>
                  </div>
                );
              })()}

            {report.summary && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {report.summary}
              </p>
            )}

            {failed.length > 0 && (
              <TestSuite name="Failed" status="failed" defaultOpen>
                <TestSuiteName>
                  <TestSuiteStats failed={failed.length} />
                </TestSuiteName>
                <TestSuiteContent>
                  {failed.map((item, idx) => (
                    <div key={idx}>
                      <Test name={item.requirement} status="failed" />
                      <p className="px-4 pb-2 text-xs text-muted-foreground sm:px-6 md:px-10">
                        {item.detail}
                      </p>
                    </div>
                  ))}
                </TestSuiteContent>
              </TestSuite>
            )}

            {passed.length > 0 && (
              <TestSuite name="Passed" status="passed">
                <TestSuiteName>
                  <TestSuiteStats passed={passed.length} />
                </TestSuiteName>
                <TestSuiteContent>
                  {passed.map((item, idx) => (
                    <div key={idx}>
                      <Test name={item.requirement} status="passed" />
                      <p className="px-4 pb-2 text-xs text-muted-foreground sm:px-6 md:px-10">
                        {item.detail}
                      </p>
                    </div>
                  ))}
                </TestSuiteContent>
              </TestSuite>
            )}
          </TestResultsContent>
        </>
      )}
    </TestResults>
  );
}

function RunListItem({
  report,
  isActive,
  onClick,
}: {
  report: EvaluationReport;
  isActive: boolean;
  onClick: () => void;
}) {
  const passed = report.results.filter((r) => r.passed).length;
  const failed = report.results.filter((r) => !r.passed).length;
  const total = report.results.length;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 ${
        isActive
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-transparent hover:bg-muted/50"
      }`}
    >
      {report.status === "completed" && (
        <>
          {failed === 0 ? (
            <IconCheck size={14} className="text-success shrink-0" />
          ) : report.prUrl ? (
            <IconGitPullRequest size={14} className="text-primary shrink-0" />
          ) : (
            <IconX size={14} className="text-destructive shrink-0" />
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-sm tabular-nums">
              {passed}/{total} passed
            </span>
            <span className="text-xs text-muted-foreground">
              {passRate}% &middot; {dayjs(report.createdAt).fromNow()}
              {report.fixStatus === "fixing" && " · Fixing..."}
              {report.prUrl && " · PR created"}
            </span>
          </div>
        </>
      )}
      {report.status === "error" && (
        <>
          <IconAlertTriangle size={14} className="text-destructive shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-sm text-destructive">Error</span>
            <span className="text-xs text-muted-foreground">
              {dayjs(report.createdAt).fromNow()}
            </span>
          </div>
        </>
      )}
      {report.status === "running" && (
        <>
          <Spinner size="sm" />
          <div className="flex flex-col min-w-0">
            <span className="text-sm text-muted-foreground">Running...</span>
            <span className="text-xs text-muted-foreground">
              {dayjs(report.createdAt).fromNow()}
            </span>
          </div>
        </>
      )}
    </button>
  );
}

function CodeTestingContent({
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
      <div className="flex items-center justify-center h-32">
        <Spinner />
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
        <p className="text-sm">No test runs yet</p>
        <p className="text-xs mt-1">
          Click &quot;Run Test&quot; to evaluate this doc
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden sm:flex-row">
      <div className="w-full shrink-0 border-b overflow-y-auto scrollbar p-2 space-y-1 max-h-32 sm:max-h-none sm:w-56 sm:border-b-0 sm:border-r">
        <p className="text-xs font-medium text-muted-foreground px-2 py-1">
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

      <div className="flex-1 overflow-y-auto scrollbar p-4">
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

function TestingArenaDetailRoute() {
  const { id } = Route.useParams();
  const { repo } = useRepo();
  const doc = useQuery(api.docs.get, { id: id as Id<"docs"> });
  const reports = useQuery(
    api.evaluationReports.listByDoc,
    doc ? { docId: doc._id } : "skip",
  );
  const activeReport = reports?.find(
    (r) => r.status === "running" || r.fixStatus === "fixing",
  );
  const streaming = useQuery(
    api.streaming.get,
    activeReport ? { entityId: activeReport._id } : "skip",
  );
  const startEvaluation = useMutation(api.evaluationWorkflow.startEvaluation);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useQueryState("tab", testingTabParser);
  const [branch, setBranch] = useQueryState("branch", branchParser);

  const handleRunTest = async () => {
    if (!doc) return;
    setIsRunning(true);
    try {
      await startEvaluation({
        docId: doc._id,
        repoId: repo._id,
        branchName: branch !== "main" ? branch : undefined,
      });
    } finally {
      setIsRunning(false);
    }
  };

  if (doc === undefined) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (doc === null) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
        <p>Document not found</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-2 py-2 flex flex-col gap-1.5 sm:px-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v as "code" | "ui");
            }}
          >
            <TabsList className="h-8">
              <TabsTrigger value="code" className="text-xs space-x-2">
                <IconCode size={14} />
                <span>Code Testing</span>
              </TabsTrigger>
              <TabsTrigger value="ui" className="text-xs space-x-2">
                <IconWorld size={14} />
                <span>UI Testing</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-2">
            <BranchSelect
              value={branch}
              onValueChange={setBranch}
              className="h-7 text-xs w-24 sm:w-36"
            />
            <Button
              size="sm"
              onClick={activeTab === "code" ? handleRunTest : undefined}
              disabled={activeTab === "code" && isRunning}
            >
              <IconPlayerPlay size={16} />
              {isRunning && activeTab === "code" ? "Running..." : "Run Test"}
            </Button>
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === "code" ? (
          <CodeTestingContent
            reports={reports}
            streamingActivity={streaming?.currentActivity}
          />
        ) : (
          <UITestingPanel />
        )}
      </div>
    </div>
  );
}
