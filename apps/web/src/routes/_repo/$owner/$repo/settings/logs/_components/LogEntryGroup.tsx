import { useState, createElement } from "react";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@eva/backend";
import {
  Badge,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@eva/ui";
import { ProviderIcon } from "@eva/ui/ai";
import { IconChevronRight, IconCode } from "@tabler/icons-react";
import { AnimatePresence, m } from "motion/react";
import dayjs from "@eva/shared/dates";
import { formatDurationMsShort } from "@eva/shared/duration";
import {
  parseResultEvent,
  getTotalInputTokens,
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
        className="motion-base flex items-center gap-1.5 rounded-lg px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
      >
        <IconCode className="size-3" />
        {open ? "Hide raw" : "View raw"}
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <m.div
            key="raw-event"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <pre className="mt-2 max-h-48 overflow-auto scrollbar rounded-surface bg-muted/50 p-3 font-mono text-xs leading-relaxed text-muted-foreground">
              {formatted}
            </pre>
          </m.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function LogTypeIcon({ type }: { type: string }) {
  return createElement(iconFor(type), {
    className: "size-4 shrink-0 text-muted-foreground",
  });
}

export function LogEntryGroup({ type, logs, total }: LogEntryGroupProps) {
  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger className="motion-base flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted/60 sm:gap-2.5 sm:px-4 [&[data-state=open]>.chevron-icon]:rotate-90">
        <IconChevronRight className="chevron-icon size-3.5 shrink-0 text-muted-foreground transition-transform" />
        <LogTypeIcon type={type} />
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
                className="motion-base rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/25"
              >
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {log.entityTitle}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <Badge variant="outline" className="font-mono text-2xs">
                      {evt.provider && (
                        <ProviderIcon
                          provider={evt.provider}
                          size={11}
                          className="mr-1"
                        />
                      )}
                      {evt.model}
                    </Badge>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {formatTokens(getTotalInputTokens(evt))} in /{" "}
                      {formatTokens(evt.outputTokens)} out
                    </span>
                    {evt.durationMs > 0 && (
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {formatDurationMsShort(evt.durationMs)}
                      </span>
                    )}
                    <span className="font-mono text-xs font-medium tabular-nums">
                      {formatCost(evt.costUsd)}
                    </span>
                    <span className="text-xs text-subtle-foreground">
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
