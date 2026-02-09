"use client";

import { use, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import type { Id } from "@conductor/backend";
import {
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
import { IconPlayerPlay, IconWorld, IconCode } from "@tabler/icons-react";
import dayjs from "@/lib/dates";
import { UITestingPanel } from "../UITestingPanel";

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
      {report.status === "running" && (
        <div className="flex items-center gap-3 px-4 py-3">
          <Spinner size="sm" />
          <span className="text-sm text-muted-foreground truncate">
            {streamingActivity || "Evaluating codebase..."}
          </span>
        </div>
      )}

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
            <span className="text-sm text-muted-foreground">
              {dayjs(report.createdAt).fromNow()}
            </span>
          </TestResultsHeader>

          <TestResultsContent>
            <TestResultsProgress />

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
                      <p className="px-10 pb-2 text-xs text-muted-foreground">
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
                      <p className="px-10 pb-2 text-xs text-muted-foreground">
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

function CodeTestingContent({
  reports,
  streamingActivity,
}: {
  reports: EvaluationReport[] | undefined;
  streamingActivity?: string;
}) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto scrollbar p-4">
        {reports === undefined ? (
          <div className="flex items-center justify-center h-32">
            <Spinner />
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <p className="text-sm">No test runs yet</p>
            <p className="text-xs mt-1">
              Click &quot;Run Test&quot; to evaluate this doc
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <ReportCard
                key={report._id}
                report={report}
                streamingActivity={
                  report.status === "running" ? streamingActivity : undefined
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TestingArenaDocPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { repo } = useRepo();
  const doc = useQuery(api.docs.get, { id: id as Id<"docs"> });
  const reports = useQuery(
    api.evaluationReports.listByDoc,
    doc ? { docId: doc._id } : "skip",
  );
  const runningReport = reports?.find((r) => r.status === "running");
  const streaming = useQuery(
    api.streaming.get,
    runningReport ? { entityId: runningReport._id } : "skip",
  );
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("code");

  const handleRunTest = async () => {
    if (!doc) return;
    setIsRunning(true);
    try {
      await fetch("/api/inngest/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "testing-arena/evaluate.doc",
          data: { docId: doc._id, repoId: repo._id },
        }),
      });
    } finally {
      setIsRunning(false);
    }
  };

  if (doc === undefined) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  if (doc === null) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-background text-muted-foreground">
        <p>Document not found</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      <div className="px-4 py-2 flex flex-col gap-1">
        <div className="flex items-center justify-between ">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-8">
              <TabsTrigger value="code" className="text-xs">
                <IconCode size={14} />
                <span>Code Testing</span>
              </TabsTrigger>
              <TabsTrigger value="ui" className="text-xs">
                <IconWorld size={14} />
                <span>UI Testing</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
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
