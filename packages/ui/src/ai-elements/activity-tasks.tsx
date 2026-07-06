"use client";

import { memo } from "react";
import type { ComponentProps, ReactNode } from "react";

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

// Thinking is a transient liveness pulse and the streamed response duplicates
// the final reply, so both stay hidden. Reasoning is shown as a collapsed
// "Thought process" accordion (see ActivityBlockRow).
const HIDDEN_TYPES = new Set<ActivityStep["type"]>(["thinking", "response"]);

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
  const isReasoning = block.type === "reasoning";
  const fileVerb = getFileVerb(block.type, isActive);

  return (
    // Reasoning stays collapsed by default (it's opt-in detail); other blocks
    // auto-open while active so their live output is visible.
    <Task
      key={block.status}
      defaultOpen={isReasoning ? false : isActive}
      className="w-full"
    >
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
          isReasoning ? (
            <p
              key={i}
              className="whitespace-pre-wrap text-muted-foreground text-xs italic"
            >
              {item.detail ?? item.label}
            </p>
          ) : isFileType ? (
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

    return (
      <div className={cn("space-y-1.5 text-sm", className)} {...props}>
        {isStreaming && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Spinner size="sm" />
            {icon}
            <Shimmer as="span" duration={2.5} spread={1.5}>
              {headerText}
            </Shimmer>
          </div>
        )}
        {blocks.map((block, i) => (
          <ActivityBlockRow key={i} block={block} />
        ))}
        {/* Elapsed time for the completed turn (once streaming has ended). */}
        {!isStreaming && duration && (
          <div className="text-muted-foreground text-xs">
            Worked for {duration}
          </div>
        )}
      </div>
    );
  },
);

ActivityTasks.displayName = "ActivityTasks";
