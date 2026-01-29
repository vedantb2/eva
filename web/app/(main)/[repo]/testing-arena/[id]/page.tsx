"use client";

import { use, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/api";
import { useRepo } from "@/lib/contexts/RepoContext";
import { GenericId as Id } from "convex/values";
import { Button } from "@heroui/button";
import {
  IconPlayerPlay,
  IconCheck,
  IconX,
  IconChevronDown,
  IconChevronRight,
} from "@tabler/icons-react";
import dayjs from "@/lib/dates";

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
  const styles = {
    pending:
      "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300",
    running: "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300",
    completed:
      "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
    error: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
  };

  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function ReportCard({ report }: { report: EvaluationReport }) {
  const [expandedMet, setExpandedMet] = useState(false);
  const [expandedNotMet, setExpandedNotMet] = useState(false);

  const metCount = report.requirementsMet.length;
  const notMetCount = report.requirementsNotMet.length;

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-neutral-500 dark:text-neutral-400">
          {dayjs(report.createdAt).format("M/D/YYYY, h:mm:ss A")}
        </div>
        <StatusBadge status={report.status} />
      </div>

      {report.status === "running" && (
        <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
          <span className="text-sm">Evaluating codebase...</span>
        </div>
      )}

      {report.status === "error" && report.error && (
        <div className="text-red-600 dark:text-red-400 text-sm">
          Error: {report.error}
        </div>
      )}

      {report.status === "completed" && (
        <>
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <IconCheck size={16} />
              <span className="text-sm font-medium">{metCount} met</span>
            </div>
            <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
              <IconX size={16} />
              <span className="text-sm font-medium">{notMetCount} not met</span>
            </div>
          </div>

          {report.summary && (
            <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-3">
              {report.summary}
            </p>
          )}

          {metCount > 0 && (
            <div className="mb-2">
              <button
                type="button"
                onClick={() => setExpandedMet(!expandedMet)}
                className="flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400 hover:underline"
              >
                {expandedMet ? (
                  <IconChevronDown size={16} />
                ) : (
                  <IconChevronRight size={16} />
                )}
                Requirements Met ({metCount})
              </button>
              {expandedMet && (
                <ul className="mt-2 space-y-2 pl-5">
                  {report.requirementsMet.map((item, idx) => (
                    <li key={idx} className="text-sm">
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">
                        {item.requirement}
                      </span>
                      <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-0.5">
                        {item.evidence}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {notMetCount > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setExpandedNotMet(!expandedNotMet)}
                className="flex items-center gap-1 text-sm font-medium text-red-600 dark:text-red-400 hover:underline"
              >
                {expandedNotMet ? (
                  <IconChevronDown size={16} />
                ) : (
                  <IconChevronRight size={16} />
                )}
                Requirements Not Met ({notMetCount})
              </button>
              {expandedNotMet && (
                <ul className="mt-2 space-y-2 pl-5">
                  {report.requirementsNotMet.map((item, idx) => (
                    <li key={idx} className="text-sm">
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">
                        {item.requirement}
                      </span>
                      <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-0.5">
                        {item.reason}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
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

  const handleRunTest = async () => {
    if (!doc) return;
    setIsRunning(true);
    try {
      await fetch("/api/testing-arena/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId: doc._id, repoId: repo._id }),
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
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white truncate">
          {doc.title}
        </h2>
        <Button
          size="sm"
          color="primary"
          startContent={<IconPlayerPlay size={16} />}
          onPress={handleRunTest}
          isLoading={isRunning}
        >
          Run Test
        </Button>
      </div>
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
