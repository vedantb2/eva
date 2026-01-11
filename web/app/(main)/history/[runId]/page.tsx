"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { Container } from "@/lib/components/ui/Container";
import { PageHeader } from "@/lib/components/PageHeader";
import { LogViewer } from "@/lib/components/agent/LogViewer";
import { RunMetadata } from "@/lib/components/agent/RunMetadata";
import { IconArrowLeft, IconLayoutKanban } from "@tabler/icons-react";

type RunStatus = "queued" | "running" | "success" | "error";

const statusConfig: Record<RunStatus, { bg: string; text: string; label: string }> = {
  queued: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-700 dark:text-yellow-400",
    label: "Queued",
  },
  running: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    label: "Running",
  },
  success: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
    label: "Success",
  },
  error: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
    label: "Error",
  },
};

interface PageProps {
  params: Promise<{ runId: string }>;
}

export default function RunDetailPage({ params }: PageProps) {
  const { runId } = use(params);
  const run = useQuery(api.agentRuns.getWithDetails, {
    id: runId as Id<"agentRuns">,
  });

  if (run === undefined) {
    return (
      <>
        <PageHeader title="Run Details" />
        <Container>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600" />
          </div>
        </Container>
      </>
    );
  }

  if (run === null) {
    return (
      <>
        <PageHeader title="Run Details" />
        <Container>
          <div className="text-center py-12">
            <p className="text-neutral-500 dark:text-neutral-400">Run not found</p>
            <Link
              href="/history"
              className="inline-flex items-center gap-2 mt-4 text-pink-600 hover:text-pink-700"
            >
              <IconArrowLeft size={16} />
              Back to history
            </Link>
          </div>
        </Container>
      </>
    );
  }

  const config = statusConfig[run.status];

  return (
    <>
      <PageHeader
        title="Run Details"
        headerRight={
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${config.bg} ${config.text}`}>
            {config.label}
          </span>
        }
      />
      <Container>
        <div className="mb-4">
          <Link
            href="/history"
            className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            <IconArrowLeft size={16} />
            Back to history
          </Link>
        </div>

        <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              {run.taskTitle}
            </h2>
            {run.taskDescription && (
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                {run.taskDescription}
              </p>
            )}
            <Link
              href={`/boards/${run.boardId}`}
              className="inline-flex items-center gap-1.5 text-sm text-pink-600 hover:text-pink-700"
            >
              <IconLayoutKanban size={16} />
              {run.boardName}
            </Link>
          </div>

          <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
            <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
              Execution Details
            </h3>
            <RunMetadata
              startedAt={run.startedAt}
              finishedAt={run.finishedAt}
              status={run.status}
              resultSummary={run.resultSummary}
              prUrl={run.prUrl}
              error={run.error}
            />
          </div>

          <div className="p-6">
            <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
              Execution Logs
            </h3>
            <LogViewer logs={run.logs} className="max-h-[600px]" />
          </div>
        </div>
      </Container>
    </>
  );
}
