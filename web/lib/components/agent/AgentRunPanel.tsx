"use client";

import { useQuery } from "convex/react";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { LogViewer } from "./LogViewer";
import { RunMetadata } from "./RunMetadata";

interface AgentRunPanelProps {
  taskId: Id<"agentTasks">;
}

export function AgentRunPanel({ taskId }: AgentRunPanelProps) {
  const runs = useQuery(api.agentRuns.listByTask, { taskId });

  if (runs === undefined) {
    return (
      <div className="p-4 text-sm text-neutral-500 dark:text-neutral-400">Loading runs...</div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="p-4 text-sm text-neutral-500 dark:text-neutral-400 italic">
        No runs yet. Move this task to the &quot;In Progress&quot; column to start an agent run.
      </div>
    );
  }

  const latestRun = runs[0];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Latest Run
        </h4>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            latestRun.status === "success"
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : latestRun.status === "error"
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                : latestRun.status === "running"
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
          }`}
        >
          {latestRun.status}
        </span>
      </div>

      <RunMetadata
        startedAt={latestRun.startedAt}
        finishedAt={latestRun.finishedAt}
        status={latestRun.status}
        resultSummary={latestRun.resultSummary}
        prUrl={latestRun.prUrl}
        error={latestRun.error}
      />

      <div>
        <h5 className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">Logs</h5>
        <LogViewer logs={latestRun.logs} className="max-h-64" />
      </div>

      {runs.length > 1 && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {runs.length - 1} previous run{runs.length > 2 ? "s" : ""} available
        </p>
      )}
    </div>
  );
}
