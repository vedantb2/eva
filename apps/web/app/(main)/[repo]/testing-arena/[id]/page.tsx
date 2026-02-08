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
  Card,
  CardContent,
  Spinner,
} from "@conductor/ui";
import {
  IconPlayerPlay,
  IconCheck,
  IconX,
  IconChevronDown,
  IconChevronRight,
  IconWorld,
  IconCode,
} from "@tabler/icons-react";
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
  const [showPassed, setShowPassed] = useState(false);

  const passed = report.results.filter((r) => r.passed);
  const failed = report.results.filter((r) => !r.passed);
  const total = report.results.length;
  const passRate = total > 0 ? Math.round((passed.length / total) * 100) : 0;

  return (
    <Card className="shadow-none bg-secondary">
      <CardContent className="flex flex-col gap-4 p-4">
        {report.status === "running" && (
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-border border-t-primary" />
            <span className="text-sm text-muted-foreground truncate">
              {streamingActivity || "Evaluating codebase..."}
            </span>
          </div>
        )}

        {report.status === "error" && report.error && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {report.error}
          </p>
        )}

        {report.status === "completed" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-3xl font-semibold text-foreground tabular-nums">
                  {passed.length}/{total}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {passRate}% passed
                </p>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1 tabular-nums">
                  <IconCheck size={14} className="text-primary" />
                  {passed.length}
                </span>
                <span className="inline-flex items-center gap-1 tabular-nums">
                  <IconX size={14} className="text-red-500" />
                  {failed.length}
                </span>
              </div>
              <span className="text-sm text-muted-foreground tabular-nums ml-auto">
                {dayjs(report.createdAt).fromNow()}
              </span>
            </div>

            <div className="h-1 rounded-full bg-secondary overflow-hidden flex">
              {passed.length > 0 && (
                <div
                  className="h-full bg-primary"
                  style={{ width: `${passRate}%` }}
                />
              )}
            </div>

            {report.summary && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {report.summary}
              </p>
            )}

            {failed.length > 0 && (
              <div className="space-y-1.5">
                {failed.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <IconX
                      size={14}
                      className="mt-0.5 text-red-500 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm text-foreground">
                        {item.requirement}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {passed.length > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowPassed(!showPassed)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassed ? (
                    <IconChevronDown size={14} />
                  ) : (
                    <IconChevronRight size={14} />
                  )}
                  {passed.length} passed
                </button>
                {showPassed && (
                  <div className="mt-2 space-y-1.5 pl-5">
                    {passed.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <IconCheck
                          size={14}
                          className="mt-0.5 text-primary flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-sm text-foreground">
                            {item.requirement}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.detail}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
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
