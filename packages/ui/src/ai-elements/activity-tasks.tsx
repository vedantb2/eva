"use client";

import { memo, useState } from "react";
import type { ComponentProps, ReactNode } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import {
  ChevronDownIcon,
  CircleIcon,
  CircleCheckBigIcon,
  LoaderIcon,
} from "lucide-react";
import { cn } from "../utils/cn";
import { Spinner } from "../ui/spinner";
import { Shimmer } from "./shimmer";
import {
  type ActivityStep,
  type TodoItem,
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
  /**
   * When provided, file chips with a known full path become clickable and call
   * this with the path. Pass a stable callback — {@link ActivityTasks} is memoised.
   */
  onOpenFile?: (path: string) => void;
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

/** Status glyph for one todo row. */
function TodoStatusIcon({ status }: { status: TodoItem["status"] }) {
  if (status === "completed") {
    return (
      <CircleCheckBigIcon className="mt-0.5 size-3.5 shrink-0 text-primary" />
    );
  }
  if (status === "in_progress") {
    return (
      <LoaderIcon className="mt-0.5 size-3.5 shrink-0 animate-spin text-primary" />
    );
  }
  return (
    <CircleIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
  );
}

/** Renders a todo checklist, or a plain fallback line for legacy/empty snapshots. */
function TodoChecklist({
  todos,
  fallback,
}: {
  todos: TodoItem[];
  fallback: string;
}) {
  if (todos.length === 0) {
    return <TaskItem>{fallback}</TaskItem>;
  }
  return (
    <ul className="space-y-1">
      {todos.map((todo, i) => (
        <li key={i} className="flex items-start gap-2 text-sm">
          <TodoStatusIcon status={todo.status} />
          <span
            className={cn(
              "leading-snug",
              todo.status === "completed" &&
                "text-muted-foreground line-through",
              todo.status === "in_progress" && "font-medium text-foreground",
              todo.status === "pending" && "text-muted-foreground",
            )}
          >
            {todo.content}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** One subagent row: its description plus its own nested activity, indented. */
function SubtaskItem({
  item,
  childBlocks,
  onOpenFile,
}: {
  item: ActivityStep;
  childBlocks?: ActivityBlock[];
  onOpenFile?: (path: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <TaskItem>{item.detail ?? item.label}</TaskItem>
      {childBlocks && childBlocks.length > 0 ? (
        <div className="ml-1 space-y-1.5 border-l border-border pl-3">
          {childBlocks.map((child, i) => (
            <ActivityBlockRow key={i} block={child} onOpenFile={onOpenFile} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ActivityBlockRow({
  block,
  onOpenFile,
}: {
  block: ActivityBlock;
  onOpenFile?: (path: string) => void;
}) {
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
        {block.type === "todos"
          ? block.items.map((item, i) => (
              <TodoChecklist
                key={i}
                todos={item.todos ?? []}
                fallback={item.detail ?? item.label}
              />
            ))
          : block.type === "subtask"
            ? block.items.map((item, i) => (
                <SubtaskItem
                  key={i}
                  item={item}
                  childBlocks={
                    item.toolUseId
                      ? block.subtaskChildren?.[item.toolUseId]
                      : undefined
                  }
                  onOpenFile={onOpenFile}
                />
              ))
            : block.items.map((item, i) =>
                isFileType ? (
                  <TaskItem key={i}>
                    <span className="inline-flex max-w-full items-center gap-1">
                      {fileVerb}
                      {item.path && onOpenFile ? (
                        <button
                          type="button"
                          title={item.path}
                          onClick={() => onOpenFile(item.path ?? "")}
                          className="inline-flex min-w-0 max-w-full cursor-pointer"
                        >
                          <TaskItemFile className="transition-colors hover:bg-muted">
                            {item.detail ?? item.label}
                          </TaskItemFile>
                        </button>
                      ) : (
                        <TaskItemFile>{item.detail ?? item.label}</TaskItemFile>
                      )}
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
  onOpenFile,
}: {
  blocks: ActivityBlock[];
  isStreaming?: boolean;
  onOpenFile?: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const overflow = blocks.length - MAX_VISIBLE_BLOCKS;
  const isCapped = overflow > 0 && !expanded;
  const visible = isCapped
    ? isStreaming
      ? blocks.slice(blocks.length - MAX_VISIBLE_BLOCKS)
      : blocks.slice(0, MAX_VISIBLE_BLOCKS)
    : blocks;

  // Streaming turns show the toggle above the list (newest kept at the
  // bottom); settled turns show it below. Same element either way.
  const toggle =
    overflow > 0 ? (
      <OverflowToggle
        expanded={expanded}
        overflow={overflow}
        onToggle={() => setExpanded((v) => !v)}
      />
    ) : null;

  return (
    <>
      {isStreaming && toggle}
      {visible.map((block, i) => (
        <ActivityBlockRow key={i} block={block} onOpenFile={onOpenFile} />
      ))}
      {!isStreaming && toggle}
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
    icon: _icon,
    className,
    startedAt,
    duration,
    finalText,
    onOpenFile,
    ...props
  }: ActivityTasksProps) => {
    const verb = useSpinnerVerb(Boolean(isStreaming));
    const elapsed = useElapsedSeconds(startedAt, Boolean(isStreaming));
    const blocks = groupSteps(steps).filter(
      (block) => !HIDDEN_TYPES.has(block.type),
    );

    if (blocks.length === 0 && !isStreaming) return null;

    void finalText;

    // When real tool/file blocks exist, they already shimmer their own titles —
    // don't also show the random "Eva is inferring…" header above them.
    // When only hidden steps (thinking) remain, prefer that step's label over
    // a random verb so sandbox startup can say "Starting sandbox..." immediately.
    const activeStep =
      steps.find((step) => step.status === "active") ?? steps[0];
    const headerText =
      blocks.length > 0
        ? null
        : `${
            activeStep?.label ?? `${name ?? "Eva"} is ${verb.toLowerCase()}...`
          }${startedAt ? ` (${formatElapsed(elapsed)})` : ""}`;

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
            <ActivityBlockList
              blocks={blocks}
              isStreaming={false}
              onOpenFile={onOpenFile}
            />
          </CollapsibleContent>
        </Collapsible>
      );
    }

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
            <ActivityBlockList
              blocks={blocks}
              isStreaming={false}
              onOpenFile={onOpenFile}
            />
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <div className={cn("space-y-1.5 text-sm", className)} {...props}>
        {isStreaming && headerText ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Spinner size="sm" />
            <Shimmer as="span" duration={2.5} spread={1.5}>
              {headerText}
            </Shimmer>
          </div>
        ) : null}
        <ActivityBlockList
          blocks={blocks}
          isStreaming={isStreaming}
          onOpenFile={onOpenFile}
        />
      </div>
    );
  },
);

ActivityTasks.displayName = "ActivityTasks";
