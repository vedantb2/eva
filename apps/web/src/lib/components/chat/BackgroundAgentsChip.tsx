"use client";

import {
  Badge,
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@eva/ui";
import type { BackgroundAgentEntry } from "@eva/backend";
import { IconLoader2, IconPlayerStop, IconRobot } from "@tabler/icons-react";
import { useState } from "react";

type BackgroundAgent = BackgroundAgentEntry;

function isRunningAgent(agent: BackgroundAgent): boolean {
  return agent.status === "running";
}

function formatStatus(status: string): string {
  return status.replaceAll("_", " ");
}

export function BackgroundAgentsChip({
  backgroundAgents,
  isReadOnly,
  onRequestStop,
}: {
  backgroundAgents: BackgroundAgent[] | undefined;
  isReadOnly?: boolean;
  onRequestStop: (toolUseId: string) => Promise<void>;
}) {
  const [stoppingIds, setStoppingIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const runningAgents = (backgroundAgents ?? []).filter(isRunningAgent);
  if (runningAgents.length === 0) {
    return null;
  }

  const handleStop = async (toolUseId: string) => {
    setStoppingIds((prev) => new Set(prev).add(toolUseId));
    // Cleanup is duplicated into the catch instead of using `finally`: React
    // Compiler bails on the whole file when it meets a `finally` clause.
    const clearStopping = () =>
      setStoppingIds((prev) => {
        const next = new Set(prev);
        next.delete(toolUseId);
        return next;
      });
    try {
      await onRequestStop(toolUseId);
    } catch (error) {
      clearStopping();
      throw error;
    }
    clearStopping();
  };

  const label =
    runningAgents.length === 1
      ? "1 background agent"
      : `${runningAgents.length} background agents`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-1 text-xs text-foreground shadow-sm hover:bg-muted"
        >
          <IconRobot className="size-3.5 shrink-0 text-muted-foreground" />
          <span>{label}</span>
          <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
            {runningAgents.length}
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <ul className="divide-y divide-border">
          {runningAgents.map((agent) => {
            const isStopping = stoppingIds.has(agent.toolUseId);
            return (
              <li
                key={agent.toolUseId}
                className="flex items-start gap-2 px-3 py-2.5"
              >
                <IconRobot className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 grow">
                  <p className="truncate text-sm font-medium text-foreground">
                    {agent.description?.trim() || "Background agent"}
                  </p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {formatStatus(agent.status)}
                    {agent.backgrounded ? " · backgrounded" : ""}
                  </p>
                </div>
                {!isReadOnly ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    disabled={isStopping}
                    onClick={() => {
                      void handleStop(agent.toolUseId);
                    }}
                  >
                    {isStopping ? (
                      <IconLoader2 className="size-3.5 animate-spin" />
                    ) : (
                      <IconPlayerStop className="size-3.5" />
                    )}
                    Stop
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
