"use client";

import { useMemo, useCallback } from "react";
import { useQueryState, useQueryStates } from "nuqs";
import { useQuery } from "convex/react";
import { api } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { timeRangeParser, logEntityTypesParser } from "@/lib/search-params";
import { getStartTime } from "@/lib/components/analytics/TimeRangeFilter";
import { Spinner } from "@conductor/ui";
import { IconFileOff } from "@tabler/icons-react";
import { parseResultEvent } from "./logs/_utils";
import { LogsSummaryGrid } from "./logs/_components/LogsSummaryGrid";
import { LogsHeader } from "./logs/_components/LogsHeader";
import { LogEntryGroup } from "./logs/_components/LogEntryGroup";

export function LogsClient() {
  const { repo } = useRepo();
  const [timeRange, setTimeRange] = useQueryState("range", timeRangeParser);
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

  const startTime = useMemo(() => getStartTime(timeRange), [timeRange]);

  const logs = useQuery(api.logs.listByRepo, {
    repoId: repo._id,
    startTime: startTime ?? undefined,
    entityTypes: entityTypes.length > 0 ? entityTypes : undefined,
  });

  const {
    totalCost,
    totalInput,
    totalOutput,
    totalDuration,
    grouped,
    availableTypes,
  } = useMemo(() => {
    if (!logs)
      return {
        totalCost: 0,
        totalInput: 0,
        totalOutput: 0,
        totalDuration: 0,
        grouped: [],
        availableTypes: [],
      };

    let cost = 0;
    let input = 0;
    let output = 0;
    let duration = 0;
    const groups = new Map<string, { logs: typeof logs; total: number }>();

    for (const log of logs) {
      const parsed = parseResultEvent(log.rawResultEvent);
      cost += parsed.costUsd;
      input += parsed.inputTokens;
      output += parsed.outputTokens;
      duration += parsed.durationMs;
      const existing = groups.get(log.entityType);
      if (existing) {
        existing.logs.push(log);
        existing.total += parsed.costUsd;
      } else {
        groups.set(log.entityType, {
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
      totalDuration: duration,
      grouped: sorted,
      availableTypes: sorted.map((g) => g.type),
    };
  }, [logs]);

  return (
    <PageWrapper
      title={
        logs !== undefined && logs.length > 0 ? `Logs (${logs.length})` : "Logs"
      }
      headerRight={
        <LogsHeader
          visibleTypes={visibleTypes}
          availableTypes={availableTypes}
          onTypeToggle={handleTypeToggle}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
        />
      }
    >
      {logs === undefined ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : logs.length === 0 ? (
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
          />
          <div className="space-y-1">
            {grouped.map((group) => (
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
