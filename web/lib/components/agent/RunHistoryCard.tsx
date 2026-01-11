"use client";

import Link from "next/link";
import { GenericId as Id } from "convex/values";
import { IconClock, IconLayoutKanban, IconChevronRight } from "@tabler/icons-react";

type RunStatus = "queued" | "running" | "success" | "error";

interface RunHistoryCardProps {
  run: {
    _id: Id<"agentRuns">;
    taskTitle: string;
    boardName: string;
    boardId: Id<"boards">;
    status: RunStatus;
    startedAt?: number;
    finishedAt?: number;
  };
}

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

function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(startMs: number, endMs: number): string {
  const durationSec = Math.floor((endMs - startMs) / 1000);
  if (durationSec < 60) return `${durationSec}s`;
  const minutes = Math.floor(durationSec / 60);
  const seconds = durationSec % 60;
  if (minutes < 60) return `${minutes}m ${seconds}s`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

export function RunHistoryCard({ run }: RunHistoryCardProps) {
  const config = statusConfig[run.status];

  return (
    <Link
      href={`/history/${run._id}`}
      className="block p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
            {run.taskTitle}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            <IconLayoutKanban size={14} />
            <span className="truncate">{run.boardName}</span>
          </div>
          {run.startedAt && (
            <div className="flex items-center gap-2 mt-1 text-xs text-neutral-400 dark:text-neutral-500">
              <IconClock size={12} />
              <span>{formatDateTime(run.startedAt)}</span>
              {run.finishedAt && (
                <span className="text-neutral-300 dark:text-neutral-600">
                  ({formatDuration(run.startedAt, run.finishedAt)})
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.bg} ${config.text}`}
          >
            {config.label}
          </span>
          <IconChevronRight size={16} className="text-neutral-400" />
        </div>
      </div>
    </Link>
  );
}
