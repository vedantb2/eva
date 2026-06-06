"use client";

import type { ComponentType } from "react";
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
import {
  ChainOfThought,
  ChainOfThoughtContentArea,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from "./chain-of-thought";
import type {
  ActivityStep,
  ActivityStepsViewProps,
} from "./activity-steps-shared";
import { Shimmer } from "./shimmer";
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
  read: { icon: FileSearchIcon, defaultLabel: "Read file" },
  edit: { icon: PencilIcon, defaultLabel: "Edited file" },
  write: { icon: FilePlusIcon, defaultLabel: "Created file" },
  bash: { icon: TerminalIcon, defaultLabel: "Ran command" },
  search_files: { icon: FolderSearchIcon, defaultLabel: "Found files" },
  search_code: { icon: FileTextIcon, defaultLabel: "Searched code" },
  web_fetch: { icon: GlobeIcon, defaultLabel: "Fetched URL" },
  web_search: { icon: SearchIcon, defaultLabel: "Web search" },
  subtask: { icon: WorkflowIcon, defaultLabel: "Ran agent" },
  notebook: { icon: BookOpenIcon, defaultLabel: "Edited notebook" },
  thinking: { icon: EvaThinkingIcon, defaultLabel: "Thinking..." },
  question: { icon: MessageSquareIcon, defaultLabel: "Asked a question" },
  tool: { icon: WrenchIcon, defaultLabel: "Used tool" },
} satisfies Record<
  ActivityStep["type"],
  { icon: ComponentType<{ className?: string }>; defaultLabel: string }
>;

interface ActivityTimelineItemProps {
  step: ActivityStep;
  isLast: boolean;
}

const ActivityTimelineItem = memo(
  ({ step, isLast }: ActivityTimelineItemProps) => {
    const config = stepConfig[step.type];
    const label = step.label || config.defaultLabel;

    return (
      <ChainOfThoughtStep
        icon={step.status === "active" ? undefined : config.icon}
        label={
          <div className="flex items-center gap-2">
            {step.status === "active" && <Spinner size="sm" />}
            {step.status === "active" ? (
              <Shimmer as="span" duration={2.5} spread={1.5}>
                {label}
              </Shimmer>
            ) : (
              <span>{label}</span>
            )}
          </div>
        }
        description={step.detail}
        status={step.status}
        className={isLast ? "[&_.bg-border]:hidden" : ""}
      />
    );
  },
);

ActivityTimelineItem.displayName = "ActivityTimelineItem";

export const ActivityStepsTimelineView = memo(
  ({
    steps,
    isStreaming,
    icon,
    name: _name,
    className,
    startedAt: _startedAt,
    duration: _duration,
    headerLabel,
    open,
    onOpenChange,
    ...props
  }: ActivityStepsViewProps) => (
    <ChainOfThought
      open={open}
      onOpenChange={onOpenChange}
      className={cn("text-sm", className)}
      {...props}
    >
      <ChainOfThoughtHeader icon={icon}>
        {isStreaming ? (
          <Shimmer as="span" duration={2.5} spread={1.5}>
            {headerLabel}
          </Shimmer>
        ) : (
          headerLabel
        )}
      </ChainOfThoughtHeader>
      <ChainOfThoughtContentArea>
        <div className="max-h-64 space-y-1 overflow-y-auto scrollbar">
          {steps.map((step, i) => (
            <ActivityTimelineItem
              key={`${step.type}-${i}`}
              step={step}
              isLast={i === steps.length - 1}
            />
          ))}
        </div>
      </ChainOfThoughtContentArea>
    </ChainOfThought>
  ),
);

ActivityStepsTimelineView.displayName = "ActivityStepsTimelineView";
