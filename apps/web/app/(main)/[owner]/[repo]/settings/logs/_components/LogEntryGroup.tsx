"use client";

import { useState } from "react";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@conductor/backend";
import {
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

export function LogEntryGroup({ type, logs, total }: LogEntryGroupProps) {
  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger className="flex w-full items-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium hover:bg-accent/50 sm:gap-2 sm:px-3 sm:text-sm [&[data-state=open]>svg]:rotate-90">
        <IconChevronRight size={14} className="transition-transform" />
        <span>{labelFor(type)}</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {logs.length} log
          {logs.length !== 1 ? "s" : ""}
          {" \u00b7 "}
          {formatCost(total)}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-2 space-y-px sm:ml-5">
          {logs.map((log) => {
            const evt = parseResultEvent(log.rawResultEvent);
            return (
              <div
                key={log._id}
                className="rounded-md px-3 py-2 hover:bg-accent/30"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3 text-xs sm:text-sm">
                  <span className="min-w-0 flex-1 truncate">
                    {log.entityTitle}
                  </span>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs">
                      {evt.model}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatTokens(evt.inputTokens)} in /{" "}
                      {formatTokens(evt.outputTokens)} out
                    </span>
                    {evt.durationMs > 0 && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDurationMsShort(evt.durationMs)}
                      </span>
                    )}
                    <span className="shrink-0 font-mono text-xs">
                      {formatCost(evt.costUsd)}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
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
