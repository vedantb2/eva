"use client";

import { useMemo } from "react";
import { useQueryState } from "nuqs";
import { useQuery } from "convex/react";
import { api } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { timeRangeParser, costEntityTypeParser } from "@/lib/search-params";
import {
  TimeRangeFilter,
  type TimeRange,
  getStartTime,
} from "@/lib/components/analytics/TimeRangeFilter";
import {
  Button,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  Spinner,
} from "@conductor/ui";
import { IconChevronRight, IconFilter } from "@tabler/icons-react";
import dayjs from "@conductor/shared/dates";

const ENTITY_TYPE_LABELS: Record<string, string> = {
  quickTask: "Quick Tasks",
  session: "Sessions",
  designSession: "Design Sessions",
  researchQuery: "Research Queries",
  project: "Projects",
  doc: "Docs",
  evaluation: "Evaluations",
  sessionAudit: "Session Audits",
  taskAudit: "Task Audits",
  summarize: "Summaries",
  testGen: "Test Generation",
};

function labelFor(entityType: string): string {
  return ENTITY_TYPE_LABELS[entityType] ?? entityType;
}

function formatCost(cost: number): string {
  return `$${cost.toFixed(4)}`;
}

export function CostLogsClient() {
  const { repo } = useRepo();
  const [timeRange, setTimeRange] = useQueryState("range", timeRangeParser);
  const [entityType, setEntityType] = useQueryState(
    "type",
    costEntityTypeParser,
  );

  const startTime = useMemo(() => getStartTime(timeRange), [timeRange]);

  const logs = useQuery(api.costLogs.listByRepo, {
    repoId: repo._id,
    startTime: startTime ?? undefined,
    entityType: entityType ?? undefined,
  });

  const { totalCost, grouped, availableTypes } = useMemo(() => {
    if (!logs) return { totalCost: 0, grouped: [], availableTypes: [] };

    let total = 0;
    const groups = new Map<string, { logs: typeof logs; total: number }>();

    for (const log of logs) {
      total += log.costUsd;
      const existing = groups.get(log.entityType);
      if (existing) {
        existing.logs.push(log);
        existing.total += log.costUsd;
      } else {
        groups.set(log.entityType, { logs: [log], total: log.costUsd });
      }
    }

    const sorted = Array.from(groups.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .map(([type, data]) => ({ type, ...data }));

    return {
      totalCost: total,
      grouped: sorted,
      availableTypes: sorted.map((g) => g.type),
    };
  }, [logs]);

  return (
    <PageWrapper
      title="Cost Logs"
      headerRight={
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm">
                <IconFilter size={14} />
                {entityType ? labelFor(entityType) : "All Types"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuRadioGroup
                value={entityType ?? ""}
                onValueChange={(v) => setEntityType(v || null)}
              >
                <DropdownMenuRadioItem value="">
                  All Types
                </DropdownMenuRadioItem>
                {availableTypes.map((type) => (
                  <DropdownMenuRadioItem key={type} value={type}>
                    {labelFor(type)}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
        </div>
      }
    >
      {logs === undefined ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : logs.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          No cost logs found
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">Total Cost</div>
            <div className="text-2xl font-semibold">
              {formatCost(totalCost)}
            </div>
            <div className="text-xs text-muted-foreground">
              {logs.length} log{logs.length !== 1 ? "s" : ""}
            </div>
          </div>

          <div className="space-y-2">
            {grouped.map((group) => (
              <Collapsible key={group.type} defaultOpen>
                <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent/50 [&[data-state=open]>svg]:rotate-90">
                  <IconChevronRight
                    size={14}
                    className="transition-transform"
                  />
                  <span>{labelFor(group.type)}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {group.logs.length} log
                    {group.logs.length !== 1 ? "s" : ""}
                    {" \u00b7 "}
                    {formatCost(group.total)}
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="ml-5 space-y-px">
                    {group.logs.map((log) => (
                      <div
                        key={log._id}
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent/30"
                      >
                        <span className="min-w-0 flex-1 truncate">
                          {log.entityTitle}
                        </span>
                        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs">
                          {log.model}
                        </span>
                        <span className="shrink-0 font-mono text-xs">
                          {formatCost(log.costUsd)}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {dayjs(log.createdAt).format("MMM D, HH:mm")}
                        </span>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
