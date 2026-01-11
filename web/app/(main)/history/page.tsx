"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/api";
import { Container } from "@/lib/components/ui/Container";
import { PageHeader } from "@/lib/components/PageHeader";
import { EmptyState } from "@/lib/components/ui/EmptyState";
import { RunHistoryCard } from "@/lib/components/agent/RunHistoryCard";
import { IconHistory } from "@tabler/icons-react";

type StatusFilter = "all" | "running" | "success" | "error";

const filterTabs: Array<{ key: StatusFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "running", label: "Running" },
  { key: "success", label: "Completed" },
  { key: "error", label: "Failed" },
];

export default function HistoryPage() {
  const runs = useQuery(api.agentRuns.listAll);
  const [filter, setFilter] = useState<StatusFilter>("all");

  const filteredRuns = runs?.filter((run) => {
    if (filter === "all") return true;
    if (filter === "running") return run.status === "queued" || run.status === "running";
    return run.status === filter;
  });

  return (
    <>
      <PageHeader title="Run History" />
      <Container>
        <div className="mb-6 flex gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === tab.key
                  ? "bg-pink-600 text-white"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {runs === undefined ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600" />
          </div>
        ) : filteredRuns && filteredRuns.length === 0 ? (
          <EmptyState
            icon={IconHistory}
            title={filter === "all" ? "No runs yet" : `No ${filter === "running" ? "active" : filter} runs`}
            description={
              filter === "all"
                ? "Agent runs will appear here once you start executing tasks"
                : "Try changing the filter to see other runs"
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredRuns?.map((run) => (
              <RunHistoryCard key={run._id} run={run} />
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
