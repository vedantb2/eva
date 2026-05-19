"use client";

import { useMemo, useCallback } from "react";
import { useQueryState, useQueryStates } from "nuqs";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import {
  timeRangeParser,
  logEntityTypesParser,
  searchParser,
  logGroupByParser,
} from "@/lib/search-params";
import type { LogGroupBy } from "@/lib/search-params";
import { getStartTime } from "@/lib/components/analytics/TimeRangeFilter";
import { Spinner } from "@conductor/ui";
import { IconFileOff } from "@tabler/icons-react";
import { parseResultEvent } from "./logs/_utils";
import { LogsSummaryGrid } from "./logs/_components/LogsSummaryGrid";
import { LogsHeader } from "./logs/_components/LogsHeader";
import { LogEntryGroup } from "./logs/_components/LogEntryGroup";
import { ProjectLogGroup } from "./logs/_components/ProjectLogGroup";
import type { FunctionReturnType } from "convex/server";

type LogEntry = FunctionReturnType<typeof api.logs.listByRepo>[number];

function groupByType(logs: LogEntry[]) {
  const groups = new Map<string, { logs: LogEntry[]; total: number }>();
  for (const log of logs) {
    const parsed = parseResultEvent(log.rawResultEvent);
    const existing = groups.get(log.entityType);
    if (existing) {
      existing.logs.push(log);
      existing.total += parsed.costUsd;
    } else {
      groups.set(log.entityType, { logs: [log], total: parsed.costUsd });
    }
  }
  return Array.from(groups.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .map(([type, data]) => ({ type, ...data }));
}

const UNLINKED_KEY = "__unlinked__";

function groupByProject(logs: LogEntry[]) {
  const groups = new Map<
    string,
    { title: string; logs: LogEntry[]; total: number }
  >();
  for (const log of logs) {
    const parsed = parseResultEvent(log.rawResultEvent);
    const key = log.projectId ?? UNLINKED_KEY;
    const title = log.projectTitle ?? "Other";
    const existing = groups.get(key);
    if (existing) {
      existing.logs.push(log);
      existing.total += parsed.costUsd;
    } else {
      groups.set(key, { title, logs: [log], total: parsed.costUsd });
    }
  }
  return Array.from(groups.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .map(([key, data]) => ({ key, ...data }));
}

export function LogsClient() {
  const { repo } = useRepo();
  const [timeRange, setTimeRange] = useQueryState("range", timeRangeParser);
  const [searchQuery, setSearchQuery] = useQueryState("q", searchParser);
  const [groupBy, setGroupBy] = useQueryState("groupBy", logGroupByParser);
  const [{ entityTypes }, setEntityParams] = useQueryStates({
    entityTypes: logEntityTypesParser,
  });

  const visibleTypes = useMemo(() => new Set(entityTypes), [entityTypes]);

  const handleTypeToggle = useCallback(
    (type: string, allTypes: string[]) => {
      const next = new Set(visibleTypes.size === 0 ? allTypes : visibleTypes);
      if (next.has(type)) {
        if (next.size === 1) return;
        next.delete(type);
      } else {
        next.add(type);
      }
      const isAll = allTypes.every((t) => next.has(t));
      void setEntityParams({ entityTypes: isAll ? [] : [...next] });
    },
    [visibleTypes, setEntityParams],
  );

  const handleGroupByChange = useCallback(
    (value: LogGroupBy) => {
      void setGroupBy(value);
    },
    [setGroupBy],
  );

  const startTime = useMemo(() => getStartTime(timeRange), [timeRange]);

  const logs = useQuery(api.logs.listByRepo, {
    repoId: repo._id,
    startTime: startTime ?? undefined,
    entityTypes: entityTypes.length > 0 ? entityTypes : undefined,
  });

  const filteredLogs = useMemo(() => {
    if (!logs) return undefined;
    const query = (searchQuery ?? "").toLowerCase().trim();
    if (!query) return logs;
    return logs.filter((log) => log.entityTitle.toLowerCase().includes(query));
  }, [logs, searchQuery]);

  const {
    totalCost,
    totalInput,
    totalOutput,
    totalCacheRead,
    totalCacheWrite,
    totalDuration,
    typeGroups,
    projectGroups,
    availableTypes,
  } = useMemo(() => {
    if (!filteredLogs)
      return {
        totalCost: 0,
        totalInput: 0,
        totalOutput: 0,
        totalCacheRead: 0,
        totalCacheWrite: 0,
        totalDuration: 0,
        typeGroups: [],
        projectGroups: [],
        availableTypes: [],
      };

    let cost = 0;
    let input = 0;
    let output = 0;
    let cacheRead = 0;
    let cacheWrite = 0;
    let duration = 0;

    for (const log of filteredLogs) {
      const parsed = parseResultEvent(log.rawResultEvent);
      cost += parsed.costUsd;
      input += parsed.inputTokens;
      output += parsed.outputTokens;
      cacheRead += parsed.cacheReadTokens;
      cacheWrite += parsed.cacheCreationTokens;
      duration += parsed.durationMs;
    }

    const tGroups = groupByType(filteredLogs);
    const pGroups = groupByProject(filteredLogs);

    return {
      totalCost: cost,
      totalInput: input,
      totalOutput: output,
      totalCacheRead: cacheRead,
      totalCacheWrite: cacheWrite,
      totalDuration: duration,
      typeGroups: tGroups,
      projectGroups: pGroups,
      availableTypes: tGroups.map((g) => g.type),
    };
  }, [filteredLogs]);

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
          groupBy={groupBy}
          onGroupByChange={handleGroupByChange}
        />
      }
    >
      {filteredLogs === undefined ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <div className="rounded-xl bg-secondary p-3">
            <IconFileOff size={24} />
          </div>
          <p className="text-sm">No logs found for this time range</p>
        </div>
      ) : (
        <div className="space-y-5">
          <LogsSummaryGrid
            totalCost={totalCost}
            totalDuration={totalDuration}
            totalInput={totalInput}
            totalOutput={totalOutput}
            totalCacheRead={totalCacheRead}
            totalCacheWrite={totalCacheWrite}
          />
          <div className="space-y-1">
            {groupBy === "type"
              ? typeGroups.map((group) => (
                  <LogEntryGroup
                    key={group.type}
                    type={group.type}
                    logs={group.logs}
                    total={group.total}
                  />
                ))
              : projectGroups.map((group) => (
                  <ProjectLogGroup
                    key={group.key}
                    projectTitle={group.title}
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
