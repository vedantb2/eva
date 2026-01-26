"use client";

import { useQuery } from "convex/react";
import { api } from "@/api";
import { useRepo } from "@/lib/contexts/RepoContext";
import { GenericId as Id } from "convex/values";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { Button } from "@heroui/button";
import { IconPlayerPlay, IconFileText, IconCheck, IconX, IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import { useState } from "react";

interface Doc {
  _id: Id<"docs">;
  title: string;
}

interface EvaluationReport {
  _id: Id<"evaluationReports">;
  status: "pending" | "running" | "completed" | "error";
  requirementsMet: Array<{ requirement: string; evidence: string }>;
  requirementsNotMet: Array<{ requirement: string; reason: string }>;
  summary?: string;
  error?: string;
  createdAt: number;
}

function DocsListPanel({
  docs,
  selectedId,
  onSelect,
}: {
  docs: Doc[] | undefined;
  selectedId: Id<"docs"> | null;
  onSelect: (id: Id<"docs">) => void;
}) {
  if (docs === undefined) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (docs.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-neutral-400">
        <IconFileText size={32} className="mb-2" />
        <p className="text-sm">No documents yet</p>
        <p className="text-xs mt-1">Create docs to test against</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
      <div className="p-2 space-y-1">
        {docs.map((doc) => (
          <button
            key={doc._id}
            type="button"
            onClick={() => onSelect(doc._id)}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              selectedId === doc._id
                ? "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300"
                : "hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
            }`}
          >
            <IconFileText size={16} className="flex-shrink-0" />
            <span className="truncate text-sm">{doc.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: EvaluationReport["status"] }) {
  const styles = {
    pending: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300",
    running: "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300",
    completed: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
    error: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status]}`}>
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
          {new Date(report.createdAt).toLocaleString()}
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
                {expandedMet ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
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
                {expandedNotMet ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
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

function ReportsPanel({
  doc,
  repoId,
}: {
  doc: Doc | undefined;
  repoId: Id<"githubRepos">;
}) {
  const reports = useQuery(
    api.evaluationReports.listByDoc,
    doc ? { docId: doc._id } : "skip"
  );
  const [isRunning, setIsRunning] = useState(false);

  const handleRunTest = async () => {
    if (!doc) return;
    setIsRunning(true);
    try {
      await fetch("/api/testing-arena/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docId: doc._id, repoId }),
      });
    } finally {
      setIsRunning(false);
    }
  };

  if (!doc) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-neutral-100/40 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-400">
        <IconFileText size={48} className="mb-3" />
        <p>Select a document to test</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-800 rounded-lg border border-teal-700 dark:border-teal-200 overflow-hidden">
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
      <div className="flex-1 overflow-y-auto p-4">
        {reports === undefined ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600" />
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-neutral-400">
            <p className="text-sm">No test runs yet</p>
            <p className="text-xs mt-1">
              Click "Run Test" to evaluate this doc
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

export function TestingArenaClient() {
  const { repo } = useRepo();
  const docs = useQuery(api.docs.list, { repoId: repo._id });
  const [selectedId, setSelectedId] = useState<Id<"docs"> | null>(null);
  const [isTestingAll, setIsTestingAll] = useState(false);

  const selectedDoc = docs?.find((d) => d._id === selectedId);

  const handleTestAll = async () => {
    if (!docs || docs.length === 0) return;
    setIsTestingAll(true);
    try {
      for (const doc of docs) {
        await fetch("/api/testing-arena/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ docId: doc._id, repoId: repo._id }),
        });
      }
    } finally {
      setIsTestingAll(false);
    }
  };

  return (
    <PageWrapper
      title="Testing Arena"
      fillHeight
      headerRight={
        <Button
          color="primary"
          startContent={<IconPlayerPlay size={16} />}
          onPress={handleTestAll}
          isLoading={isTestingAll}
          isDisabled={!docs || docs.length === 0}
        >
          Test All Docs
        </Button>
      }
    >
      <div className="grid grid-cols-3 grid-rows-[1fr] gap-2 flex-1 min-h-0">
        <div className="col-span-1 h-full overflow-hidden">
          <DocsListPanel
            docs={docs}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
        <div className="col-span-2 h-full overflow-hidden">
          <ReportsPanel doc={selectedDoc} repoId={repo._id} />
        </div>
      </div>
    </PageWrapper>
  );
}
