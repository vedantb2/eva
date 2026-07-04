"use client";

import type { ComponentProps, ReactNode } from "react";

import { cn } from "../utils/cn";
import { Spinner } from "../ui/spinner";
import { Shimmer } from "./shimmer";
import { MessageResponse } from "./message";
import {
  type ActivityStep,
  stepConfig,
  useSpinnerVerb,
  useElapsedSeconds,
  formatElapsed,
} from "./activity-shared";
import {
  type ActivityBlock,
  groupSteps,
  getBlockTitle,
  dropTrailingResponseBlock,
} from "./activity-tasks-utils";
import { Task, TaskContent, TaskItem, TaskItemFile, TaskTrigger } from "./task";
import { memo } from "react";

export type { ActivityStep };

export interface ActivityTasksProps extends ComponentProps<"div"> {
  steps: ActivityStep[];
  isStreaming?: boolean;
  name?: string;
  icon?: ReactNode;
  startedAt?: number;
  duration?: string;
  /**
   * The final text rendered adjacent to this activity (e.g. resultSummary or
   * message content). Runs recorded by an interim callback version bake that
   * same text into the last "response" step, duplicating it on screen — when
   * set, a trailing response block matching this text is hidden.
   */
  finalText?: string;
}

const FILE_TYPES = new Set<ActivityStep["type"]>([
  "read",
  "edit",
  "write",
  "notebook",
]);

function ActivityBlockRow({ block }: { block: ActivityBlock }) {
  const config = stepConfig[block.type] ?? stepConfig.tool;
  const isActive = block.status === "active";

  if (block.type === "thinking" || block.type === "question") {
    const lastItem = block.items[block.items.length - 1];
    const Icon = config.icon;
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        {isActive ? <Spinner size="sm" /> : <Icon className="size-4" />}
        {isActive ? (
          <Shimmer as="span" duration={2.5} spread={1.5}>
            {lastItem.label}
          </Shimmer>
        ) : (
          <span>{lastItem.label}</span>
        )}
      </div>
    );
  }

  // Reasoning: a "Thought" accordion holding the model's raw thinking text
  // in italics — expanded with a spinner while active, collapsed once done.
  if (block.type === "reasoning") {
    const Icon = config.icon;
    const title = getBlockTitle(block);
    return (
      // Keyed on status so the accordion remounts (and collapses) when the
      // block flips from active to complete during streaming.
      <Task key={block.status} defaultOpen={isActive}>
        <TaskTrigger
          title={
            <>
              {isActive ? <Spinner size="sm" /> : <Icon className="size-4" />}
              {isActive ? (
                <Shimmer as="span" duration={2.5} spread={1.5}>
                  {title}
                </Shimmer>
              ) : (
                <span>{title}</span>
              )}
            </>
          }
        />
        <TaskContent>
          {block.items.map((item, i) => (
            <p
              key={i}
              className="whitespace-pre-wrap text-muted-foreground italic"
            >
              {item.detail ?? item.label}
            </p>
          ))}
        </TaskContent>
      </Task>
    );
  }

  // Response: the agent's actual streamed message text, rendered as markdown
  // inline in the activity flow (no accordion — this is the real reply).
  if (block.type === "response") {
    return (
      <div className="space-y-1 text-sm text-foreground">
        {block.items.map((item, i) => (
          <MessageResponse
            key={i}
            className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
          >
            {item.detail ?? item.label}
          </MessageResponse>
        ))}
      </div>
    );
  }

  const Icon = config.icon;
  const title = getBlockTitle(block);
  const isFileType = FILE_TYPES.has(block.type);

  return (
    // Keyed on status so the uncontrolled accordion remounts (and collapses)
    // when a streaming block flips from active to complete.
    <Task key={block.status} defaultOpen={isActive}>
      <TaskTrigger
        title={
          <>
            {isActive ? <Spinner size="sm" /> : <Icon className="size-4" />}
            {isActive ? (
              <Shimmer as="span" duration={2.5} spread={1.5}>
                {title}
              </Shimmer>
            ) : (
              <span>{title}</span>
            )}
          </>
        }
      />
      <TaskContent>
        {block.items.map((item, i) =>
          isFileType ? (
            <TaskItemFile key={i}>{item.detail ?? item.label}</TaskItemFile>
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

    if (steps.length === 0) return null;

    // `duration` is accepted for drop-in compatibility with the old
    // ActivitySteps API but is not rendered here.
    void duration;

    const blocks = dropTrailingResponseBlock(groupSteps(steps), finalText);
    const headerText = `${name ?? "Eva"} is ${verb.toLowerCase()}…${
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
      </div>
    );
  },
);

ActivityTasks.displayName = "ActivityTasks";
