"use client";

import { useMemo, useCallback, useState } from "react";
import { useQueryState, useQueryStates } from "nuqs";
import { useQuery } from "convex/react";
import { api } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { timeRangeParser, logEntityTypesParser } from "@/lib/search-params";
import {
  TimeRangeFilter,
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
  DropdownMenuCheckboxItem,
  Spinner,
} from "@conductor/ui";
import { IconChevronRight, IconFilter, IconCode } from "@tabler/icons-react";
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

function formatTokens(count: number): string {
  if (count === 0) return "0";
  if (count >= 1e12) return `${(count / 1e12).toFixed(1)}T`;
  if (count >= 1e9) return `${(count / 1e9).toFixed(1)}B`;
  if (count >= 1e6) return `${(count / 1e6).toFixed(1)}M`;
  if (count >= 1e3) return `${(count / 1e3).toFixed(1)}k`;
  return String(count);
}

function formatDuration(ms: number): string {
  if (ms === 0) return "-";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatTotalDuration(ms: number): string {
  if (ms === 0) return "0s";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

const USD_TO_GBP = 0.79;

interface ParsedResultEvent {
  costUsd: number;
  model: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
}

const EMPTY_PARSED: ParsedResultEvent = {
  costUsd: 0,
  model: "-",
  inputTokens: 0,
  outputTokens: 0,
  durationMs: 0,
  cacheReadTokens: 0,
  cacheCreationTokens: 0,
};

function parseResultEvent(raw: string | undefined): ParsedResultEvent {
  if (!raw) return EMPTY_PARSED;
  try {
    const parsed = JSON.parse(raw);
    const usage = parsed.usage ?? {};
    const modelUsage = parsed.modelUsage ?? {};
    const modelKeys = Object.keys(modelUsage);
    const inputTokens =
      (typeof usage.input_tokens === "number" ? usage.input_tokens : 0) +
      (typeof usage.cache_read_input_tokens === "number"
        ? usage.cache_read_input_tokens
        : 0) +
      (typeof usage.cache_creation_input_tokens === "number"
        ? usage.cache_creation_input_tokens
        : 0);
    return {
      costUsd:
        typeof parsed.total_cost_usd === "number" ? parsed.total_cost_usd : 0,
      model: modelKeys.length > 0 ? modelKeys[0] : "-",
      inputTokens,
      outputTokens:
        typeof usage.output_tokens === "number" ? usage.output_tokens : 0,
      durationMs:
        typeof parsed.duration_ms === "number" ? parsed.duration_ms : 0,
      cacheReadTokens:
        typeof usage.cache_read_input_tokens === "number"
          ? usage.cache_read_input_tokens
          : 0,
      cacheCreationTokens:
        typeof usage.cache_creation_input_tokens === "number"
          ? usage.cache_creation_input_tokens
          : 0,
    };
  } catch {
    return EMPTY_PARSED;
  }
}

function RawEventViewer({ raw }: { raw: string | undefined }) {
  const [open, setOpen] = useState(false);
  if (!raw) return null;

  let formatted = raw;
  try {
    formatted = JSON.stringify(JSON.parse(raw), null, 2);
  } catch {}

  return (
    <div className="mt-1">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <IconCode size={12} />
        {open ? "Hide" : "Raw"}
      </button>
      {open && (
        <pre className="mt-1 max-h-48 overflow-auto rounded bg-muted p-2 text-xs">
          {formatted}
        </pre>
      )}
    </div>
  );
}

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
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm">
                <IconFilter size={14} />
                {visibleTypes.size === 0
                  ? "All Types"
                  : `${visibleTypes.size} of ${availableTypes.length} Types`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {availableTypes.map((type) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={visibleTypes.size === 0 || visibleTypes.has(type)}
                  onCheckedChange={() => handleTypeToggle(type, availableTypes)}
                  onSelect={(e) => e.preventDefault()}
                >
                  {labelFor(type)}
                </DropdownMenuCheckboxItem>
              ))}
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
          No logs found
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">Total Cost</div>
              <div className="text-2xl font-semibold">
                {formatCost(totalCost)}{" "}
                <span className="text-base font-normal text-muted-foreground">
                  ~£{(totalCost * USD_TO_GBP).toFixed(4)}
                </span>
              </div>
            </div>
            <div className="flex-1 rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">Ran For</div>
              <div className="text-2xl font-semibold">
                {formatTotalDuration(totalDuration)}
              </div>
            </div>
            <div className="flex-1 rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">Input Tokens</div>
              <div className="text-2xl font-semibold">
                {formatTokens(totalInput)}
              </div>
            </div>
            <div className="flex-1 rounded-lg border bg-card p-4">
              <div className="text-sm text-muted-foreground">Output Tokens</div>
              <div className="text-2xl font-semibold">
                {formatTokens(totalOutput)}
              </div>
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
                    {group.logs.map((log) => {
                      const evt = parseResultEvent(log.rawResultEvent);
                      return (
                        <div
                          key={log._id}
                          className="rounded-md px-3 py-2 hover:bg-accent/30"
                        >
                          <div className="flex items-center gap-3 text-sm">
                            <span className="min-w-0 flex-1 truncate">
                              {log.entityTitle}
                            </span>
                            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs">
                              {evt.model}
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {formatTokens(evt.inputTokens)} in /{" "}
                              {formatTokens(evt.outputTokens)} out
                            </span>
                            {evt.durationMs > 0 && (
                              <span className="shrink-0 text-xs text-muted-foreground">
                                {formatDuration(evt.durationMs)}
                              </span>
                            )}
                            <span className="shrink-0 font-mono text-xs">
                              {formatCost(evt.costUsd)}
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {dayjs(log.createdAt).format("MMM D, HH:mm")}
                            </span>
                          </div>
                          <RawEventViewer raw={log.rawResultEvent} />
                        </div>
                      );
                    })}
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
