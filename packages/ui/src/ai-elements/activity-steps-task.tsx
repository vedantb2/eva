"use client";

import type { ComponentType, ReactNode } from "react";
import { memo } from "react";
import {
  BookOpenIcon,
  FilePlusIcon,
  FileSearchIcon,
  FileTextIcon,
  FolderSearchIcon,
  GlobeIcon,
  MessageSquareIcon,
  PencilIcon,
  SearchIcon,
  TerminalIcon,
  WorkflowIcon,
  WrenchIcon,
} from "lucide-react";
import { Task, TaskContent, TaskItem, TaskItemFile, TaskTrigger } from "./task";
import type {
  ActivityStep,
  ActivityStepsViewProps,
} from "./activity-steps-shared";
import { Spinner } from "../ui/spinner";
import { cn } from "../utils/cn";

function EvaThinkingIcon({ className }: { className?: string }) {
  return (
    <img
      src="/icon.svg"
      alt="Eva"
      width={16}
      height={16}
      className={cn("rounded-full", className)}
    />
  );
}

const stepConfig = {
  read: { icon: FileSearchIcon, label: "Read" },
  edit: { icon: PencilIcon, label: "Edited" },
  write: { icon: FilePlusIcon, label: "Created" },
  bash: { icon: TerminalIcon, label: "Ran command" },
  search_files: { icon: FolderSearchIcon, label: "Scanning files" },
  search_code: { icon: FileTextIcon, label: "Searching code" },
  web_fetch: { icon: GlobeIcon, label: "Fetched URL" },
  web_search: { icon: SearchIcon, label: "Searched web" },
  subtask: { icon: WorkflowIcon, label: "Ran agent" },
  notebook: { icon: BookOpenIcon, label: "Edited notebook" },
  thinking: { icon: EvaThinkingIcon, label: "Thinking" },
  question: { icon: MessageSquareIcon, label: "Asked question" },
  tool: { icon: WrenchIcon, label: "Used tool" },
} satisfies Record<
  ActivityStep["type"],
  { icon: ComponentType<{ className?: string }>; label: string }
>;

function isFileActivity(type: ActivityStep["type"]): boolean {
  return (
    type === "read" ||
    type === "edit" ||
    type === "write" ||
    type === "notebook"
  );
}

function trimStreamingSuffix(label: string): string {
  return label.replace(/\.\.\.$/, "");
}

function isNoisyLegacyStep(step: ActivityStep): boolean {
  if (step.type === "thinking") return true;
  if (step.type !== "tool") return false;
  return (
    !step.detail || step.label === "Used tool" || step.label === "Using tool..."
  );
}

function getStepIdentity(step: ActivityStep): string {
  return [step.type, step.detail ?? "", getTaskLabel(step)].join("\n");
}

function getCuratedTaskSteps(steps: ActivityStep[]): ActivityStep[] {
  const curated: ActivityStep[] = [];
  let previousIdentity = "";

  for (const step of steps) {
    if (isNoisyLegacyStep(step)) continue;
    const identity = getStepIdentity(step);
    if (identity === previousIdentity) {
      const previous = curated[curated.length - 1];
      if (previous && step.status === "active") {
        curated[curated.length - 1] = { ...previous, status: "active" };
      }
      continue;
    }
    curated.push(step);
    previousIdentity = identity;
  }

  return curated;
}

function getTaskLabel(step: ActivityStep): string {
  const config = stepConfig[step.type];
  if (step.status === "active") {
    return trimStreamingSuffix(step.label || config.label);
  }
  return config.label;
}

function renderTaskItemContent(step: ActivityStep): ReactNode {
  const config = stepConfig[step.type];
  const Icon = config.icon;
  const label = getTaskLabel(step);

  if (!step.detail) {
    return (
      <span className="inline-flex min-w-0 items-center gap-2">
        {step.status === "active" && <Spinner size="sm" />}
        <span>{label}</span>
      </span>
    );
  }

  if (isFileActivity(step.type)) {
    return (
      <span className="inline-flex min-w-0 flex-wrap items-center gap-1.5">
        {step.status === "active" && <Spinner size="sm" />}
        <span>{label}</span>
        <TaskItemFile>
          <Icon className="size-3.5 shrink-0" />
          <span className="min-w-0 truncate">{step.detail}</span>
        </TaskItemFile>
      </span>
    );
  }

  return (
    <span className="inline-flex min-w-0 flex-wrap items-baseline gap-1.5">
      {step.status === "active" && <Spinner size="sm" />}
      <span>{label}</span>
      <span className="break-words rounded-md border border-border bg-secondary px-1.5 py-0.5 font-mono text-foreground text-xs">
        {step.detail}
      </span>
    </span>
  );
}

interface ActivityTaskItemProps {
  step: ActivityStep;
}

const ActivityTaskItem = memo(({ step }: ActivityTaskItemProps) => (
  <TaskItem
    className={cn(
      "fade-in-0 slide-in-from-top-2 animate-in",
      step.status === "active" ? "text-foreground" : "text-muted-foreground",
    )}
  >
    {renderTaskItemContent(step)}
  </TaskItem>
));

ActivityTaskItem.displayName = "ActivityTaskItem";

export const ActivityStepsTaskView = memo(
  ({
    steps,
    isStreaming: _isStreaming,
    name: _name,
    icon: _icon,
    className,
    startedAt: _startedAt,
    duration: _duration,
    headerLabel,
    open,
    onOpenChange,
    ...props
  }: ActivityStepsViewProps) => {
    const curatedSteps = getCuratedTaskSteps(steps);
    const fallbackStep: ActivityStep = {
      type: "thinking",
      label: "Working",
      status: "active",
    };
    const visibleSteps =
      curatedSteps.length > 0 ? curatedSteps : [fallbackStep];

    return (
      <Task
        open={open}
        onOpenChange={onOpenChange}
        className={cn("text-sm", className)}
        {...props}
      >
        <TaskTrigger title={headerLabel} />
        <TaskContent>
          {visibleSteps.map((step, i) => (
            <ActivityTaskItem key={`${step.type}-${i}`} step={step} />
          ))}
        </TaskContent>
      </Task>
    );
  },
);

ActivityStepsTaskView.displayName = "ActivityStepsTaskView";
