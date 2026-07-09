"use client";

import { memo, useState } from "react";
import type { ComponentProps, ReactNode } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "../utils/cn";
import { Spinner } from "../ui/spinner";
import { Shimmer } from "./shimmer";
import {
  type ActivityStep,
  useSpinnerVerb,
  useElapsedSeconds,
  formatElapsed,
} from "./activity-shared";
import {
  type ActivityBlock,
  groupSteps,
  getBlockTitle,
} from "./activity-tasks-utils";
import { Task, TaskContent, TaskItem, TaskItemFile, TaskTrigger } from "./task";

/** Max activity blocks shown before the overflow toggle appears (P2). */
const MAX_VISIBLE_BLOCKS = 5;

export type { ActivityStep };

export interface ActivityTasksProps extends ComponentProps<"div"> {
  steps: ActivityStep[];
  isStreaming?: boolean;
  name?: string;
  icon?: ReactNode;
  startedAt?: number;
  duration?: string;
  finalText?: string;
}

const FILE_TYPES = new Set<ActivityStep["type"]>([
  "read",
  "edit",
  "write",
  "notebook",
]);

const HIDDEN_TYPES = new Set<ActivityStep["type"]>([
  "thinking",
  "reasoning",
  "response",
]);

function getFileVerb(type: ActivityStep["type"], active: boolean): string {
  if (type === "edit" || type === "notebook") {
    return active ? "Editing" : "Edited";
  }
  if (type === "write") {
    return active ? "Creating" : "Created";
  }
  return active ? "Reading" : "Read";
}

function ActivityBlockRow({ block }: { block: ActivityBlock }) {
  const isActive = block.status === "active";
  const title = getBlockTitle(block);
  const isFileType = FILE_TYPES.has(block.type);
  const fileVerb = getFileVerb(block.type, isActive);

  return (
    <Task key={block.status} defaultOpen={isActive} className="w-full">
      <TaskTrigger
        title={
          isActive ? (
            <Shimmer as="span" duration={2.5} spread={1.5}>
              {title}
            </Shimmer>
          ) : (
            <span>{title}</span>
          )
        }
      />
      <TaskContent>
        {block.items.map((item, i) =>
          isFileType ? (
            <TaskItem key={i}>
              <span className="inline-flex max-w-full items-center gap-1">
                {fileVerb}
                <TaskItemFile>{item.detail ?? item.label}</TaskItemFile>
              </span>
            </TaskItem>
          ) : block.type === "bash" ? (
            <TaskItem
              key={i}
              className="line-clamp-2 break-all font-mono text-xs"
            >
              {item.detail ?? item.label}
            </TaskItem>
          ) : (
            <TaskItem key={i}>{item.detail ?? item.label}</TaskItem>
          ),
        )}
      </TaskContent>
    </Task>
  );
}

/**
 * Renders the activity blocks with an overflow cap (P2). When there are more
 * than MAX_VISIBLE_BLOCKS, the excess is hidden behind a muted "Show N more"
 * toggle. Settled turns cap from the front (show the first N); streaming turns
 * cap from the end (show the newest N) so the latest activity stays visible.
 */
function ActivityBlockList({
  blocks,
  isStreaming,
}: {
  blocks: ActivityBlock[];
  isStreaming?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const overflow = blocks.length - MAX_VISIBLE_BLOCKS;
  const isCapped = overflow > 0 && !expanded;
  const visible = isCapped
    ? isStreaming
      ? blocks.slice(blocks.length - MAX_VISIBLE_BLOCKS)
      : blocks.slice(0, MAX_VISIBLE_BLOCKS)
    : blocks;

  return (
    <>
      {overflow > 0 && isStreaming && (
        <OverflowToggle
          expanded={expanded}
          overflow={overflow}
          onToggle={() => setExpanded((v) => !v)}
        />
      )}
      {visible.map((block, i) => (
        <ActivityBlockRow key={i} block={block} />
      ))}
      {overflow > 0 && !isStreaming && (
        <OverflowToggle
          expanded={expanded}
          overflow={overflow}
          onToggle={() => setExpanded((v) => !v)}
        />
      )}
    </>
  );
}

function OverflowToggle({
  expanded,
  overflow,
  onToggle,
}: {
  expanded: boolean;
  overflow: number;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-fit text-muted-foreground text-sm transition-colors hover:text-foreground"
    >
      {expanded ? "Show less" : `Show ${overflow} more`}
    </button>
  );
}

export const ActivityTasks = memo(
  ({
    steps,
    isStreaming,
    name,
    icon,
    className,
    startedAt,
    duration,
    finalText,
    ...props
  }: ActivityTasksProps) => {
    const verb = useSpinnerVerb(Boolean(isStreaming));
    const elapsed = useElapsedSeconds(startedAt, Boolean(isStreaming));
    const blocks = groupSteps(steps).filter(
      (block) => !HIDDEN_TYPES.has(block.type),
    );

    if (blocks.length === 0 && !isStreaming) return null;

    void finalText;

    const headerText = `${name ?? "Eva"} is ${verb.toLowerCase()}...${
      startedAt ? ` (${formatElapsed(elapsed)})` : ""
    }`;

    // Settled turn with a known per-turn duration (P1): collapse the whole
    // turn's activity behind one "Worked for Ns" trigger, default closed.
    if (!isStreaming && duration) {
      return (
        <Collapsible
          className={cn("group text-sm", className)}
          defaultOpen={false}
          {...props}
        >
          <CollapsibleTrigger className="flex w-full items-center gap-2 border-b border-border pb-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground">
            <span>Worked for {duration}</span>
            <ChevronDownIcon className="size-4 shrink-0 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-1.5 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
            <ActivityBlockList blocks={blocks} isStreaming={false} />
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <div className={cn("space-y-1.5 text-sm", className)} {...props}>
        {isStreaming && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Spinner size="sm" />
            <Shimmer as="span" duration={2.5} spread={1.5}>
              {headerText}
            </Shimmer>
          </div>
        )}
        <ActivityBlockList blocks={blocks} isStreaming={isStreaming} />
      </div>
    );
  },
);

ActivityTasks.displayName = "ActivityTasks";
