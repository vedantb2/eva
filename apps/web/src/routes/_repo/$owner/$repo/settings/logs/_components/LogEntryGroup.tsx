"use client";

import { useState } from "react";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@conductor/backend";
import {
  Badge,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@conductor/ui";
import { IconChevronRight, IconCode } from "@tabler/icons-react";
import dayjs from "@conductor/shared/dates";
import { formatDurationMsShort } from "@/lib/utils/formatDuration";
import {
  parseResultEvent,
  formatCost,
  formatTokens,
  labelFor,
  iconFor,
} from "../_utils";

type LogEntry = FunctionReturnType<typeof api.logs.listByRepo>[number];

interface LogEntryGroupProps {
  type: string;
  logs: LogEntry[];
  total: number;
}

function RawEventViewer({ raw }: { raw: string | undefined }) {
  const [open, setOpen] = useState(false);
  if (!raw) return null;

  let formatted = raw;
  try {
    formatted = JSON.stringify(JSON.parse(raw), null, 2);
  } catch {}

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((p) => !p)}
        className="motion-base flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
      >
        <IconCode size={12} />
        {open ? "Hide raw" : "View raw"}
      </button>
      {open && (
        <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-muted/50 p-3 font-mono text-xs leading-relaxed text-muted-foreground">
          {formatted}
        </pre>
      )}
    </div>
  );
}

export function LogEntryGroup({ type, logs, total }: LogEntryGroupProps) {
  const Icon = iconFor(type);
  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger className="motion-base flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted/60 sm:gap-2.5 sm:px-4 [&[data-state=open]>.chevron-icon]:rotate-90">
        <IconChevronRight
          size={14}
          className="chevron-icon shrink-0 text-muted-foreground transition-transform"
        />
        <Icon size={16} className="shrink-0 text-muted-foreground" />
        <span className="tracking-[-0.01em]">{labelFor(type)}</span>
        <span className="ml-auto font-mono text-xs text-muted-foreground">
          {formatCost(total)}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-2 pl-3 sm:ml-4 sm:pl-4">
          {logs.map((log) => {
            const evt = parseResultEvent(log.rawResultEvent);
            return (
              <div
                key={log._id}
                className="motion-base rounded-lg px-3 py-2.5 transition-colors hover:bg-accent/25"
              >
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {log.entityTitle}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <Badge variant="outline" className="font-mono text-[11px]">
                      {evt.model}
                    </Badge>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {formatTokens(
                        evt.inputTokens +
                          evt.cacheReadTokens +
                          evt.cacheCreationTokens,
                      )}{" "}
                      in / {formatTokens(evt.outputTokens)} out
                    </span>
                    {evt.durationMs > 0 && (
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {formatDurationMsShort(evt.durationMs)}
                      </span>
                    )}
                    <span className="font-mono text-xs font-medium tabular-nums">
                      {formatCost(evt.costUsd)}
                    </span>
                    <span className="text-xs text-muted-foreground/70">
                      {dayjs(log.createdAt).format("MMM D, HH:mm")}
                    </span>
                  </div>
                </div>
                <RawEventViewer raw={log.rawResultEvent} />
              </div>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
