"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/api";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { ReportGenerator } from "@/lib/components/reports/ReportGenerator";
import { ReportDisplay } from "@/lib/components/reports/ReportDisplay";
import { DeletedWorkSection } from "@/lib/components/reports/DeletedWorkSection";
import { Chip } from "@heroui/react";
import {
  IconReportAnalytics,
  IconLoader2,
  IconAlertCircle,
  IconClock,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";
import dayjs from "@/lib/dates";
import type { GenericId } from "convex/values";

type ReportId = GenericId<"reports">;

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300",
  analyzing: "bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300",
  completed: "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300",
  error: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300",
};

export function ReportsClient() {
  const { repo } = useRepo();
  const [selectedReportId, setSelectedReportId] = useState<ReportId | null>(null);
  const [showHistory, setShowHistory] = useState(true);

  // Subscribe to all reports for this repo (real-time updates)
  const reports = useQuery(api.reports.getReportsByRepo, {
    repoId: repo._id,
    limit: 20,
  });

  // Subscribe to the selected report for real-time status updates
  const selectedReport = useQuery(
    api.reports.getReportById,
    selectedReportId ? { id: selectedReportId } : "skip"
  );

  const handleReportCreated = (reportId: string) => {
    setSelectedReportId(reportId as ReportId);
  };

  const isLoadingReports = reports === undefined;

  return (
    <PageWrapper title="Reports">
      <div className="space-y-6">
        {/* Generator */}
        <ReportGenerator onReportCreated={handleReportCreated} />

        {/* Selected Report - real-time status tracking */}
        {selectedReportId && (
          <SelectedReportView report={selectedReport} />
        )}

        {/* Report History */}
        <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center justify-between w-full text-sm font-semibold text-neutral-900 dark:text-white"
          >
            <span className="flex items-center gap-2">
              <IconClock className="w-4 h-4" />
              Report History
              {reports && (
                <Chip size="sm" variant="flat" className="bg-neutral-100 dark:bg-neutral-800">
                  {reports.length}
                </Chip>
              )}
            </span>
            {showHistory ? (
              <IconChevronUp className="w-4 h-4" />
            ) : (
              <IconChevronDown className="w-4 h-4" />
            )}
          </button>

          {showHistory && (
            <div className="mt-4">
              {isLoadingReports ? (
                <div className="flex items-center gap-2 text-sm text-neutral-500 py-4 justify-center">
                  <IconLoader2 className="w-4 h-4 animate-spin" />
                  Loading reports...
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-8">
                  <IconReportAnalytics className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    No reports yet. Select a tag above and generate your first report.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {reports.map((report) => (
                    <button
                      key={report._id}
                      onClick={() =>
                        setSelectedReportId(
                          report._id === selectedReportId ? null : (report._id as ReportId)
                        )
                      }
                      className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        report._id === selectedReportId
                          ? "bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800"
                          : "bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-750"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Chip
                          size="sm"
                          variant="flat"
                          className="bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300"
                        >
                          {report.tagId}
                        </Chip>
                        <span className="text-neutral-500 dark:text-neutral-400 text-xs truncate">
                          {report.workItemCounts.totalTasks} tasks,{" "}
                          {report.workItemCounts.totalSessions} sessions
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Chip size="sm" variant="flat" className={STATUS_STYLES[report.status]}>
                          {report.status}
                        </Chip>
                        <span className="text-xs text-neutral-400">
                          {dayjs(report.createdAt).fromNow()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SelectedReportView({ report }: { report: any }) {
  if (report === undefined) {
    return (
      <div className="flex items-center gap-2 text-sm text-neutral-500 py-8 justify-center">
        <IconLoader2 className="w-4 h-4 animate-spin" />
        Loading report...
      </div>
    );
  }

  if (report === null) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 text-center">
        <IconAlertCircle className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
        <p className="text-sm text-neutral-500">Report not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status banner */}
      <div className="flex items-center gap-3">
        <Chip
          size="sm"
          variant="flat"
          className="bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300"
        >
          {report.tagId}
        </Chip>
        <Chip size="sm" variant="flat" className={STATUS_STYLES[report.status]}>
          {report.status === "pending" && (
            <span className="flex items-center gap-1">
              <IconLoader2 className="w-3 h-3 animate-spin" />
              Pending
            </span>
          )}
          {report.status === "analyzing" && (
            <span className="flex items-center gap-1">
              <IconLoader2 className="w-3 h-3 animate-spin" />
              Analyzing
            </span>
          )}
          {report.status === "completed" && "Completed"}
          {report.status === "error" && "Error"}
        </Chip>
        <span className="text-xs text-neutral-400">
          Generated {dayjs(report.generatedAt).fromNow()}
        </span>
      </div>

      {/* Error state */}
      {report.status === "error" && report.error && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-2">
            <IconAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                Analysis failed
              </p>
              <p className="text-sm text-red-600 dark:text-red-300 mt-1">{report.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Pending/Analyzing states */}
      {(report.status === "pending" || report.status === "analyzing") && (
        <div className="bg-teal-50 dark:bg-teal-900/10 rounded-xl p-6 border border-teal-200 dark:border-teal-800 text-center">
          <IconLoader2 className="w-8 h-8 text-teal-500 mx-auto mb-3 animate-spin" />
          <p className="text-sm font-medium text-teal-800 dark:text-teal-200">
            {report.status === "pending"
              ? "Report queued for analysis..."
              : "AI analysis in progress..."}
          </p>
          <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">
            This page will update automatically when complete.
          </p>
        </div>
      )}

      {/* Report Data (always show analysis results even during AI analysis) */}
      <ReportDisplay report={report} />

      {/* Deleted work section */}
      <DeletedWorkSection tagId={report.tagId} />
    </div>
  );
}
