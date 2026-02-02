"use client";

import { use, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/api";
import { useRepo } from "@/lib/contexts/RepoContext";
import { GenericId as Id } from "convex/values";
import { Button } from "@heroui/button";
import { Tabs, Tab } from "@heroui/tabs";
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

interface EvaluationReport {
  _id: Id<"evaluationReports">;
  status: "pending" | "running" | "completed" | "error";
  requirementsMet: Array<{ requirement: string; evidence: string }>;
  requirementsNotMet: Array<{ requirement: string; reason: string }>;
  summary?: string;
  error?: string;
  createdAt: number;
}

function StatusBadge({ status }: { status: EvaluationReport["status"] }) {
  const config = {
    pending: {
      dot: "bg-yellow-500",
      text: "text-yellow-600 dark:text-yellow-400",
    },
    running: {
      dot: "bg-teal-500 animate-pulse",
      text: "text-teal-600 dark:text-teal-400",
    },
    completed: {
      dot: "bg-green-500",
      text: "text-green-600 dark:text-green-400",
    },
    error: { dot: "bg-red-500", text: "text-red-600 dark:text-red-400" },
  };
  const { dot, text } = config[status];
  return (
    <span className={`flex items-center gap-1.5 text-xs font-medium ${text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  );
}

function ReportCard({ report }: { report: EvaluationReport }) {
  const [expandedMet, setExpandedMet] = useState(false);
  const [expandedNotMet, setExpandedNotMet] = useState(false);

  const metCount = report.requirementsMet.length;
  const notMetCount = report.requirementsNotMet.length;
  const total = metCount + notMetCount;
  const passRate = total > 0 ? Math.round((metCount / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden bg-white dark:bg-neutral-800">
      <div className="px-4 py-3 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-700/50">
        <StatusBadge status={report.status} />
        <span className="text-xs text-neutral-400">
          {dayjs(report.createdAt).fromNow()}
        </span>
      </div>

      {report.status === "running" && (
        <div className="px-4 py-6 flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-teal-200 dark:border-teal-800 border-t-teal-600" />
          <span className="text-sm text-neutral-600 dark:text-neutral-300">
            Evaluating codebase...
          </span>
        </div>
      )}

      {report.status === "error" && report.error && (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-900/10 text-sm text-red-600 dark:text-red-400">
          {report.error}
        </div>
      )}

      {report.status === "completed" && (
        <>
          <div className="px-4 py-3">
            <div className="flex items-center gap-3 mb-2">
              <span
                className={`text-2xl font-bold tabular-nums ${passRate >= 80 ? "text-green-600 dark:text-green-400" : passRate >= 50 ? "text-yellow-600 dark:text-yellow-400" : "text-red-600 dark:text-red-400"}`}
              >
                {passRate}%
              </span>
              <div className="flex items-center gap-3 text-xs text-neutral-500">
                <span className="flex items-center gap-1">
                  <IconCheck size={12} className="text-green-500" /> {metCount}{" "}
                  met
                </span>
                <span className="flex items-center gap-1">
                  <IconX size={12} className="text-red-500" /> {notMetCount} not
                  met
                </span>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-700 overflow-hidden flex">
              {metCount > 0 && (
                <div
                  className="h-full bg-green-500 rounded-l-full"
                  style={{ width: `${passRate}%` }}
                />
              )}
              {notMetCount > 0 && (
                <div
                  className="h-full bg-red-400 rounded-r-full"
                  style={{ width: `${100 - passRate}%` }}
                />
              )}
            </div>
          </div>

          {report.summary && (
            <div className="px-4 pb-3">
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                {report.summary}
              </p>
            </div>
          )}

          <div className="border-t border-neutral-100 dark:border-neutral-700/50">
            {metCount > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setExpandedMet(!expandedMet)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-green-600 dark:text-green-400 hover:bg-green-50/50 dark:hover:bg-green-900/10 transition-colors"
                >
                  {expandedMet ? (
                    <IconChevronDown size={14} />
                  ) : (
                    <IconChevronRight size={14} />
                  )}
                  Requirements Met ({metCount})
                </button>
                {expandedMet && (
                  <div className="px-4 pb-3 space-y-2">
                    {report.requirementsMet.map((item, idx) => (
                      <div
                        key={idx}
                        className="pl-3 border-l-2 border-green-300 dark:border-green-700"
                      >
                        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                          {item.requirement}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {item.evidence}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            {notMetCount > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setExpandedNotMet(!expandedNotMet)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-colors"
                >
                  {expandedNotMet ? (
                    <IconChevronDown size={14} />
                  ) : (
                    <IconChevronRight size={14} />
                  )}
                  Requirements Not Met ({notMetCount})
                </button>
                {expandedNotMet && (
                  <div className="px-4 pb-3 space-y-2">
                    {report.requirementsNotMet.map((item, idx) => (
                      <div
                        key={idx}
                        className="pl-3 border-l-2 border-red-300 dark:border-red-700"
                      >
                        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                          {item.requirement}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {item.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function CodeTestingContent({
  reports,
}: {
  reports: EvaluationReport[] | undefined;
}) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto scrollbar p-4">
        {reports === undefined ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600" />
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-neutral-400">
            <p className="text-sm">No test runs yet</p>
            <p className="text-xs mt-1">
              Click &quot;Run Test&quot; to evaluate this doc
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <ReportCard key={report._id} report={report} />
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
      <div className="h-full flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (doc === null) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-900 text-neutral-400">
        <p>Document not found</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-neutral-50 dark:bg-neutral-900 overflow-hidden">
      <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-700 flex flex-col gap-1">
        <div className="flex items-center justify-between ">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white truncate">
            {doc.title}
          </h2>
          {activeTab === "code" ? (
            <Button
              size="sm"
              color="primary"
              startContent={<IconPlayerPlay size={16} />}
              onPress={handleRunTest}
              isLoading={isRunning}
            >
              Run Test
            </Button>
          ) : (
            <Button
              size="sm"
              color="primary"
              startContent={<IconPlayerPlay size={16} />}
            >
              Run Test
            </Button>
          )}
        </div>
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as string)}
          size="sm"
        >
          <Tab
            key="code"
            title={
              <div className="flex items-center gap-1.5">
                <IconCode size={14} />
                <span>Code Testing</span>
              </div>
            }
          />
          <Tab
            key="ui"
            title={
              <div className="flex items-center gap-1.5">
                <IconWorld size={14} />
                <span>UI Testing</span>
              </div>
            }
          />
        </Tabs>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === "code" ? (
          <CodeTestingContent reports={reports} />
        ) : (
          <UITestingPanel />
        )}
      </div>
    </div>
  );
}
