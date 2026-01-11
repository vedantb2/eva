"use client";

import { IconClock, IconClockStop, IconExternalLink, IconAlertCircle } from "@tabler/icons-react";

interface RunMetadataProps {
  startedAt?: number;
  finishedAt?: number;
  status: "queued" | "running" | "success" | "error";
  resultSummary?: string;
  prUrl?: string;
  error?: string;
}

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

export function RunMetadata({
  startedAt,
  finishedAt,
  status,
  resultSummary,
  prUrl,
  error,
}: RunMetadataProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-4 text-xs text-neutral-600 dark:text-neutral-400">
        {startedAt && (
          <div className="flex items-center gap-1">
            <IconClock size={14} />
            <span>Started: {formatDateTime(startedAt)}</span>
          </div>
        )}
        {finishedAt && (
          <div className="flex items-center gap-1">
            <IconClockStop size={14} />
            <span>Finished: {formatDateTime(finishedAt)}</span>
          </div>
        )}
        {startedAt && finishedAt && (
          <div className="text-neutral-500">
            Duration: {formatDuration(startedAt, finishedAt)}
          </div>
        )}
        {startedAt && !finishedAt && status === "running" && (
          <div className="text-blue-500 animate-pulse">Running...</div>
        )}
      </div>

      {resultSummary && (
        <p className="text-sm text-neutral-700 dark:text-neutral-300">{resultSummary}</p>
      )}

      {prUrl && (
        <a
          href={prUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
        >
          <IconExternalLink size={14} />
          View Pull Request
        </a>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <IconAlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}
    </div>
  );
}
