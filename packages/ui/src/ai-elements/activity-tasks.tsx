"use client";

import { memo, useCallback, useRef, useState } from "react";
import type { ComponentProps, ReactNode, Ref } from "react";
import { flushSync } from "react-dom";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import {
  ChevronDownIcon,
  CircleIcon,
  CircleCheckBigIcon,
  GitBranchIcon,
  LoaderIcon,
  SearchIcon,
  TerminalIcon,
} from "lucide-react";
import { cn } from "../utils/cn";
import { Spinner } from "../ui/spinner";
import { Shimmer } from "./shimmer";
import {
  type ActivityStep,
  type TodoItem,
  stepConfig,
  useSpinnerVerb,
  useElapsedSeconds,
  formatElapsed,
} from "./activity-shared";
import { type ActivityRow, buildActivityRows } from "./activity-tasks-utils";
import {
  deriveStepRowPresentation,
  type CommandVisualKind,
} from "./activity-step-label";
import { Task, TaskContent, TaskItem, TaskItemFile, TaskTrigger } from "./task";

/** Max activity rows shown before the overflow toggle appears. */
const MAX_VISIBLE_ROWS = 8;

/** Max nested child rows shown under a subtask before "+N more". */
const MAX_VISIBLE_CHILDREN = 8;

const HIDDEN_TYPES = new Set<ActivityStep["type"]>([
  "thinking",
  "reasoning",
  "response",
]);

/** Nearest ancestor that actually scrolls — used to keep the overflow toggle pinned. */
function findScrollParent(el: HTMLElement): HTMLElement | null {
  let current = el.parentElement;
  while (current) {
    const { overflowY } = getComputedStyle(current);
    if (
      (overflowY === "auto" ||
        overflowY === "scroll" ||
        overflowY === "overlay") &&
      current.scrollHeight > current.clientHeight
    ) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

/**
 * Expand/collapse while keeping `anchor` visually fixed (t3code work-group
 * toggle pattern). Content inserted above the control would otherwise shove it
 * down the viewport.
 */
function toggleWithScrollCompensation(
  anchor: HTMLElement,
  toggle: () => void,
): void {
  const scrollParent = findScrollParent(anchor);
  const bottomBefore = anchor.getBoundingClientRect().bottom;
  flushSync(toggle);
  const delta = anchor.getBoundingClientRect().bottom - bottomBefore;
  if (!scrollParent || Math.abs(delta) < 0.5) {
    return;
  }
  scrollParent.scrollTop += delta;
}

export type { ActivityStep };

export interface ActivityTasksProps extends ComponentProps<"div"> {
  steps: ActivityStep[];
  isStreaming?: boolean;
  name?: string;
  icon?: ReactNode;
  startedAt?: number;
  duration?: string;
  /** @deprecated Unused; kept so existing call sites compile unchanged. */
  finalText?: string;
  /**
   * When provided, file chips with a known full path become clickable and call
   * this with the path. Pass a stable callback — {@link ActivityTasks} is memoised.
   */
  onOpenFile?: (path: string) => void;
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

function bashIconForKind(kind: CommandVisualKind) {
  if (kind === "inspect") return SearchIcon;
  if (kind === "git") return GitBranchIcon;
  return TerminalIcon;
}

/** One per-call activity row with Synara-style humanized label. */
function ActivityStepRow({
  row,
  onOpenFile,
  depth = 0,
}: {
  row: ActivityRow;
  onOpenFile?: (path: string) => void;
  depth?: number;
}) {
  const { step, children } = row;
  const isActive = step.status === "active";
  const presentation = deriveStepRowPresentation(step, isActive);

  if (step.type === "todos") {
    return (
      <Task defaultOpen={isActive} className="w-full">
        <TaskTrigger
          title={
            isActive ? (
              <Shimmer as="span" duration={2.5} spread={1.5}>
                {presentation.text}
              </Shimmer>
            ) : (
              <span>{presentation.text}</span>
            )
          }
        />
        <TaskContent>
          <TodoChecklist
            todos={step.todos ?? []}
            fallback={step.detail ?? step.label}
          />
        </TaskContent>
      </Task>
    );
  }

  const config = stepConfig[step.type] ?? stepConfig.tool;
  const Icon =
    step.type === "bash" && presentation.commandKind
      ? bashIconForKind(presentation.commandKind)
      : config.icon;

  const label = (
    <span className="min-w-0 truncate" title={presentation.title}>
      {isActive ? (
        <Shimmer as="span" duration={2.5} spread={1.5}>
          {presentation.text}
        </Shimmer>
      ) : (
        presentation.text
      )}
    </span>
  );

  const fileChip = presentation.fileChip ? (
    presentation.fileChip.path && onOpenFile ? (
      <button
        type="button"
        title={presentation.fileChip.path}
        onClick={() => {
          const path = presentation.fileChip?.path;
          if (path) onOpenFile(path);
        }}
        className="inline-flex min-w-0 max-w-full cursor-pointer"
      >
        <TaskItemFile className="transition-colors hover:bg-muted">
          {presentation.fileChip.name}
        </TaskItemFile>
      </button>
    ) : (
      <TaskItemFile>{presentation.fileChip.name}</TaskItemFile>
    )
  ) : null;

  const visibleChildren = children ?? [];
  const childOverflow = visibleChildren.length - MAX_VISIBLE_CHILDREN;
  const shownChildren =
    childOverflow > 0
      ? visibleChildren.slice(0, MAX_VISIBLE_CHILDREN)
      : visibleChildren;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4 shrink-0" />
        {label}
        {fileChip}
      </div>
      {shownChildren.length > 0 ? (
        <div
          className={cn(
            "space-y-1",
            depth === 0 && "ml-1 border-l border-border pl-3",
          )}
        >
          {shownChildren.map((child, i) => (
            <ActivityStepRow
              key={`${child.step.type}-${i}-${child.step.label}`}
              row={child}
              onOpenFile={onOpenFile}
              depth={depth + 1}
            />
          ))}
          {childOverflow > 0 ? (
            <p className="text-xs text-muted-foreground">
              +{childOverflow} more
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Renders activity rows with an overflow cap. Settled turns cap from the front
 * (first N); streaming turns cap from the end (newest N) so latest stays visible.
 */
function ActivityRowList({
  rows,
  isStreaming,
  onOpenFile,
}: {
  rows: ActivityRow[];
  isStreaming?: boolean;
  onOpenFile?: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const overflow = rows.length - MAX_VISIBLE_ROWS;
  const isCapped = overflow > 0 && !expanded;
  const visible = isCapped
    ? isStreaming
      ? rows.slice(rows.length - MAX_VISIBLE_ROWS)
      : rows.slice(0, MAX_VISIBLE_ROWS)
    : rows;

  const handleToggle = useCallback(() => {
    const anchor = toggleRef.current;
    if (!anchor) {
      setExpanded((value) => !value);
      return;
    }
    toggleWithScrollCompensation(anchor, () => {
      setExpanded((value) => !value);
    });
  }, []);

  const toggle =
    overflow > 0 ? (
      <OverflowToggle
        ref={toggleRef}
        expanded={expanded}
        overflow={overflow}
        onToggle={handleToggle}
      />
    ) : null;

  return (
    <>
      {isStreaming && toggle}
      {visible.map((row, i) => (
        <ActivityStepRow
          key={`${row.step.type}-${i}-${row.step.label}`}
          row={row}
          onOpenFile={onOpenFile}
        />
      ))}
      {!isStreaming && toggle}
    </>
  );
}

function OverflowToggle({
  ref,
  expanded,
  overflow,
  onToggle,
}: {
  ref?: Ref<HTMLButtonElement>;
  expanded: boolean;
  overflow: number;
  onToggle: () => void;
}) {
  return (
    <button
      ref={ref}
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
    const rows = buildActivityRows(steps).filter(
      (row) => !HIDDEN_TYPES.has(row.step.type),
    );

    if (rows.length === 0 && !isStreaming) return null;

    void finalText;

    // When real tool/file rows exist, they already shimmer their own titles —
    // don't also show the random "Eva is inferring…" header above them.
    const activeStep = steps.find((s) => s.status === "active") ?? steps[0];
    const headerText =
      rows.length > 0
        ? null
        : `${
            activeStep?.label ?? `${name ?? "Eva"} is ${verb.toLowerCase()}...`
          }${startedAt ? ` (${formatElapsed(elapsed)})` : ""}`;

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
            <ActivityRowList
              rows={rows}
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
        <ActivityRowList
          rows={rows}
          isStreaming={isStreaming}
          onOpenFile={onOpenFile}
        />
      </div>
    );
  },
);

ActivityTasks.displayName = "ActivityTasks";
