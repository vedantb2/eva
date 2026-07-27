"use client";

import { useQueryState, useQueryStates } from "nuqs";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import {
  timeRangeParser,
  logEntityTypesParser,
  searchParser,
  logViewParser,
} from "@/lib/search-params";
import { getStartTime, DAY_MS } from "@/lib/components/analytics/timeRange";
import { useQuantizedNow } from "@/lib/hooks/useQuantizedNow";
import { Kpi } from "@/lib/components/analytics/Kpi";
import { IconFileOff } from "@tabler/icons-react";
import { SettingsEmptyState } from "@/lib/components/settings/SettingsEmptyState";
import { parseResultEvent, groupKeyFor } from "./logs/_utils";
import { LogsSummaryGrid } from "./logs/_components/LogsSummaryGrid";
import { LogsHeader } from "./logs/_components/LogsHeader";
import { LogEntryGroup } from "./logs/_components/LogEntryGroup";
import { ProjectSpendingGroup } from "./logs/_components/ProjectSpendingGroup";

export function LogsClient() {
  const { repo } = useRepo();
  const [timeRange, setTimeRange] = useQueryState("range", timeRangeParser);
  const [searchQuery, setSearchQuery] = useQueryState("q", searchParser);
  const [logView, setLogView] = useQueryState("view", logViewParser);
  const [{ entityTypes }, setEntityParams] = useQueryStates({
    entityTypes: logEntityTypesParser,
  });

  const visibleTypes = new Set(entityTypes);

  const handleTypeToggle = (type: string, allTypes: string[]) => {
    const next = new Set(visibleTypes.size === 0 ? allTypes : visibleTypes);
    if (next.has(type)) {
      if (next.size === 1) return;
      next.delete(type);
    } else {
      next.add(type);
    }
    const isAll = allTypes.every((t) => next.has(t));
    void setEntityParams({ entityTypes: isAll ? [] : [...next] });
  };

  // Quantized to the day so the window is a stable query argument: a raw clock
  // read here would change on every render and resubscribe both log queries.
  const today = useQuantizedNow(DAY_MS);
  const startTime = getStartTime(timeRange, today);

  // Fetch every log in range — group-key filtering happens on the client so
  // project-tagged entries can roll up into the "project" group regardless of
  // their underlying entityType.
  const logs = useQuery(api.logs.listByRepo, {
    repoId: repo._id,
    startTime: startTime ?? undefined,
  });

  const projectLogs = useQuery(api.logs.listByProject, {
    repoId: repo._id,
    startTime: startTime ?? undefined,
  });

  const filteredLogs = (() => {
    if (!logs) return undefined;
    const query = (searchQuery ?? "").toLowerCase().trim();
    return logs.filter((log) => {
      if (visibleTypes.size > 0 && !visibleTypes.has(groupKeyFor(log))) {
        return false;
      }
      if (query && !log.entityTitle.toLowerCase().includes(query)) {
        return false;
      }
      return true;
    });
  })();

  const {
    totalCost,
    totalInput,
    totalOutput,
    totalCacheRead,
    totalCacheWrite,
    totalDuration,
    grouped,
    availableTypes,
  } = (() => {
    if (!filteredLogs)
      return {
        totalCost: 0,
        totalInput: 0,
        totalOutput: 0,
        totalCacheRead: 0,
        totalCacheWrite: 0,
        totalDuration: 0,
        grouped: [],
        availableTypes: [],
      };

    let cost = 0;
    let input = 0;
    let output = 0;
    let cacheRead = 0;
    let cacheWrite = 0;
    let duration = 0;
    const groups = new Map<
      string,
      { logs: typeof filteredLogs; total: number }
    >();

    for (const log of filteredLogs) {
      const parsed = parseResultEvent(log.rawResultEvent);
      cost += parsed.costUsd;
      input += parsed.inputTokens;
      output += parsed.outputTokens;
      cacheRead += parsed.cacheReadTokens;
      cacheWrite += parsed.cacheCreationTokens;
      duration += parsed.durationMs;
      const key = groupKeyFor(log);
      const existing = groups.get(key);
      if (existing) {
        existing.logs.push(log);
        existing.total += parsed.costUsd;
      } else {
        groups.set(key, {
          logs: [log],
          total: parsed.costUsd,
        });
      }
    }

    const sorted = Array.from(groups.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .map(([type, data]) => ({ type, ...data }));

    return {
      totalCost: cost,
      totalInput: input,
      totalOutput: output,
      totalCacheRead: cacheRead,
      totalCacheWrite: cacheWrite,
      totalDuration: duration,
      grouped: sorted,
      availableTypes: sorted.map((g) => g.type),
    };
  })();

  const projectGroups = (() => {
    if (!projectLogs) return undefined;
    const query = (searchQuery ?? "").toLowerCase().trim();

    return projectLogs
      .flatMap((group) => {
        const filtered = query
          ? group.logs.filter(
              (log) =>
                log.entityTitle.toLowerCase().includes(query) ||
                group.projectTitle.toLowerCase().includes(query),
            )
          : group.logs;
        if (filtered.length === 0) return [];

        let totalCostForProject = 0;
        for (const log of filtered) {
          totalCostForProject += parseResultEvent(log.rawResultEvent).costUsd;
        }

        return [
          {
            projectId: group.projectId,
            projectTitle: group.projectTitle,
            logs: filtered,
            totalCost: totalCostForProject,
          },
        ];
      })
      .sort((a, b) => b.totalCost - a.totalCost);
  })();

  const isProjectView = logView === "project";
  const isLoading = isProjectView
    ? projectGroups === undefined
    : filteredLogs === undefined;
  const isEmpty = isProjectView
    ? projectGroups !== undefined && projectGroups.length === 0
    : filteredLogs !== undefined && filteredLogs.length === 0;

  return (
    <PageWrapper
      title="Logs"
      comfortable
      headerRight={
        <LogsHeader
          visibleTypes={visibleTypes}
          availableTypes={availableTypes}
          onTypeToggle={handleTypeToggle}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          searchQuery={searchQuery ?? ""}
          onSearchChange={setSearchQuery}
          logView={logView}
          onLogViewChange={setLogView}
          showTypeFilter={!isProjectView}
        />
      }
    >
      {isLoading ? (
        <div
          className="min-h-[28rem] space-y-5"
          aria-busy="true"
          aria-label="Loading logs"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-surface border border-border bg-muted/60"
              />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-surface border border-border bg-muted/60" />
        </div>
      ) : isEmpty ? (
        <div className="rounded-surface border border-border bg-card shadow-sm">
          <SettingsEmptyState
            icon={IconFileOff}
            title={
              isProjectView ? "No project spending" : "No completions logged"
            }
            description={
              isProjectView
                ? "Nothing was billed to a project in this time range. Widen the range to see more."
                : "Nothing ran in this time range. Widen the range or clear the filters to see more."
            }
          />
        </div>
      ) : (
        <div className="space-y-5">
          {!isProjectView && (
            <LogsSummaryGrid
              totalCost={totalCost}
              totalDuration={totalDuration}
              totalInput={totalInput}
              totalOutput={totalOutput}
              totalCacheRead={totalCacheRead}
              totalCacheWrite={totalCacheWrite}
            />
          )}
          {isProjectView && projectGroups && (
            <ProjectSummaryCards groups={projectGroups} />
          )}
          <div className="space-y-1">
            {isProjectView
              ? projectGroups?.map((group) => (
                  <ProjectSpendingGroup
                    key={group.projectId}
                    projectTitle={group.projectTitle}
                    logs={group.logs}
                    totalCost={group.totalCost}
                  />
                ))
              : grouped.map((group) => (
                  <LogEntryGroup
                    key={group.type}
                    type={group.type}
                    logs={group.logs}
                    total={group.total}
                  />
                ))}
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

function ProjectSummaryCards({
  groups,
}: {
  groups: Array<{ totalCost: number; logs: Array<unknown> }>;
}) {
  const totalCost = groups.reduce((sum, g) => sum + g.totalCost, 0);
  const totalLogs = groups.reduce((sum, g) => sum + g.logs.length, 0);

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
      <Kpi
        layout="row"
        label="Total Project Spending"
        value={`£${(totalCost * 0.74).toFixed(2)}`}
      />
      <Kpi layout="row" label="Projects" value={String(groups.length)} />
      <Kpi layout="row" label="Completions" value={String(totalLogs)} />
    </div>
  );
}
