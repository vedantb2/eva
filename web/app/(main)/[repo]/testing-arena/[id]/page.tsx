"use client";

import { use, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/api";
import { useRepo } from "@/lib/contexts/RepoContext";
import { GenericId as Id } from "convex/values";
import { Button } from "@heroui/button";
import { Tabs, Tab } from "@heroui/tabs";
import { Card, CardBody } from "@heroui/card";
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
    <Card shadow="none" className="bg-neutral-50 dark:bg-neutral-800/50">
      <CardBody className="p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          {report.status !== "completed" && (
            <StatusBadge status={report.status} />
          )}
          <span className="text-xs text-neutral-400 tabular-nums ml-auto">
            {dayjs(report.createdAt).fromNow()}
          </span>
        </div>

        {report.status === "running" && (
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-neutral-200 dark:border-neutral-700 border-t-teal-600" />
            <span className="text-sm text-neutral-500">
              Evaluating codebase...
            </span>
          </div>
        )}

        {report.status === "error" && report.error && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {report.error}
          </p>
        )}

        {report.status === "completed" && (
          <>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-3xl font-semibold text-neutral-900 dark:text-white tabular-nums">
                  {passRate}%
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  Pass rate
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
                <span className="inline-flex items-center gap-1 tabular-nums">
                  <IconCheck size={14} className="text-teal-600" />
                  {metCount}
                </span>
                <span className="inline-flex items-center gap-1 tabular-nums">
                  <IconX size={14} className="text-red-500" />
                  {notMetCount}
                </span>
              </div>
            </div>

            <div className="h-1 rounded-full bg-neutral-200/70 dark:bg-neutral-700/60 overflow-hidden flex">
              {metCount > 0 && (
                <div
                  className="h-full bg-teal-500"
                  style={{ width: `${passRate}%` }}
                />
              )}
            </div>

            {report.summary && (
              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                {report.summary}
              </p>
            )}

            {metCount > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setExpandedMet(!expandedMet)}
                  className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                >
                  {expandedMet ? (
                    <IconChevronDown size={14} />
                  ) : (
                    <IconChevronRight size={14} />
                  )}
                  {metCount} met
                </button>
                {expandedMet && (
                  <div className="mt-2 space-y-1.5 pl-5">
                    {report.requirementsMet.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <IconCheck
                          size={14}
                          className="mt-0.5 text-teal-600 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-sm text-neutral-900 dark:text-white">
                            {item.requirement}
                          </p>
                          <p className="text-xs text-neutral-400 mt-0.5">
                            {item.evidence}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {notMetCount > 0 && (
              <div>
                <button
                  type="button"
                  onClick={() => setExpandedNotMet(!expandedNotMet)}
                  className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                >
                  {expandedNotMet ? (
                    <IconChevronDown size={14} />
                  ) : (
                    <IconChevronRight size={14} />
                  )}
                  {notMetCount} not met
                </button>
                {expandedNotMet && (
                  <div className="mt-2 space-y-1.5 pl-5">
                    {report.requirementsNotMet.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <IconX
                          size={14}
                          className="mt-0.5 text-red-500 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-sm text-neutral-900 dark:text-white">
                            {item.requirement}
                          </p>
                          <p className="text-xs text-neutral-400 mt-0.5">
                            {item.reason}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardBody>
    </Card>
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
