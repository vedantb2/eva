"use client";

import type { ComponentProps } from "react";
import {
  ChainOfThought,
  ChainOfThoughtStep,
  ChainOfThoughtContentArea,
  ChainOfThoughtHeader,
} from "./chain-of-thought";
import { cn } from "../utils/cn";
import { Spinner } from "../ui/spinner";
import {
  FileSearchIcon,
  PencilIcon,
  FilePlusIcon,
  TerminalIcon,
  FolderSearchIcon,
  FileTextIcon,
  GlobeIcon,
  SearchIcon,
  WorkflowIcon,
  BookOpenIcon,
  BrainIcon,
  WrenchIcon,
} from "lucide-react";
import { memo, useState, useEffect } from "react";

export interface ActivityStep {
  type:
    | "read"
    | "edit"
    | "write"
    | "bash"
    | "search_files"
    | "search_code"
    | "web_fetch"
    | "web_search"
    | "subtask"
    | "notebook"
    | "thinking"
    | "tool";
  label: string;
  detail?: string;
  status: "complete" | "active";
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
  thinking: { icon: BrainIcon, defaultLabel: "Thinking..." },
  tool: { icon: WrenchIcon, defaultLabel: "Used tool" },
};

interface ActivityStepItemProps {
  step: ActivityStep;
  isLast: boolean;
}

const ActivityStepItem = memo(({ step, isLast }: ActivityStepItemProps) => {
  const config = stepConfig[step.type] ?? stepConfig.tool;

  return (
    <ChainOfThoughtStep
      icon={step.status === "active" ? undefined : config.icon}
      label={
        <div className="flex items-center gap-2">
          {step.status === "active" && <Spinner size="sm" />}
          <span className={step.status === "active" ? "font-medium" : ""}>
            {step.label}
          </span>
        </div>
      }
      description={step.detail}
      status={step.status}
      className={isLast ? "[&_.bg-border]:hidden" : ""}
    />
  );
});

ActivityStepItem.displayName = "ActivityStepItem";

export interface ActivityStepsProps extends ComponentProps<"div"> {
  steps: ActivityStep[];
  isStreaming?: boolean;
}

export const ActivitySteps = memo(
  ({ steps, isStreaming, className, ...props }: ActivityStepsProps) => {
    const [isOpen, setIsOpen] = useState(Boolean(isStreaming));

    useEffect(() => {
      setIsOpen(Boolean(isStreaming));
    }, [isStreaming]);

    if (steps.length === 0) return null;

    const headerLabel = isStreaming
      ? `Working... (${steps.length} ${steps.length === 1 ? "step" : "steps"})`
      : `${steps.length} ${steps.length === 1 ? "step" : "steps"} completed`;

    return (
      <ChainOfThought
        open={isOpen}
        onOpenChange={setIsOpen}
        className={cn("text-sm", className)}
        {...props}
      >
        <ChainOfThoughtHeader>{headerLabel}</ChainOfThoughtHeader>
        <ChainOfThoughtContentArea>
          <div className="space-y-1 max-h-64 overflow-y-auto scrollbar">
            {steps.map((step, i) => (
              <ActivityStepItem
                key={i}
                step={step}
                isLast={i === steps.length - 1}
              />
            ))}
          </div>
        </ChainOfThoughtContentArea>
      </ChainOfThought>
    );
  },
);

ActivitySteps.displayName = "ActivitySteps";
