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
import { IconChevronRight, IconLayoutKanban } from "@tabler/icons-react";
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

type ProjectGroup = FunctionReturnType<typeof api.logs.listByProject>[number];

type LogEntry = ProjectGroup["logs"][number];

interface ProjectSpendingGroupProps {
  projectTitle: string;
  logs: LogEntry[];
  totalCost: number;
}

function EntityTypeIcon({ entityType }: { entityType: string }) {
  return createElement(iconFor(entityType), {
    className: "size-3.5 shrink-0 text-muted-foreground",
  });
}

function LogRow({ log }: { log: LogEntry }) {
  const evt = parseResultEvent(log.rawResultEvent);
  return (
    <div className="motion-base rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/25">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <EntityTypeIcon entityType={log.entityType} />
          <span className="truncate text-sm">{log.entityTitle}</span>
          <Badge variant="secondary" className="shrink-0 text-3xs font-normal">
            {labelFor(log.entityType)}
          </Badge>
        </div>
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
    </div>
  );
}

export function ProjectSpendingGroup({
  projectTitle,
  logs,
  totalCost,
}: ProjectSpendingGroupProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="motion-base flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted/60 sm:gap-2.5 sm:px-4 [&[data-state=open]>.chevron-icon]:rotate-90">
        <IconChevronRight className="chevron-icon size-3.5 shrink-0 text-muted-foreground transition-transform" />
        <IconLayoutKanban className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 truncate tracking-[-0.01em]">
          {projectTitle}
        </span>
        <Badge variant="secondary" className="ml-1 text-3xs font-normal">
          {logs.length} {logs.length === 1 ? "log" : "logs"}
        </Badge>
        <span className="ml-auto font-mono text-xs text-muted-foreground">
          {formatCost(totalCost)}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-2 pl-3 sm:ml-4 sm:pl-4">
          {logs.map((log) => (
            <LogRow key={log._id} log={log} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
