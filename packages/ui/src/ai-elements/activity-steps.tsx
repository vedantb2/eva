"use client";

import type { ComponentProps, ReactNode } from "react";
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
import { memo, useState, useEffect, useRef } from "react";

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
  name?: string;
  icon?: ReactNode;
  startedAt?: number;
  duration?: string;
}

function useElapsedSeconds(startedAt: number | undefined, active: boolean) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!active || !startedAt) {
      setElapsed(0);
      return;
    }
    setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [active, startedAt]);
  return elapsed;
}

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export const ActivitySteps = memo(
  ({
    steps,
    isStreaming,
    name,
    icon,
    className,
    startedAt,
    duration,
    ...props
  }: ActivityStepsProps) => {
    const [isOpen, setIsOpen] = useState(Boolean(isStreaming));
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const elapsed = useElapsedSeconds(startedAt, Boolean(isStreaming));

    useEffect(() => {
      setIsOpen(Boolean(isStreaming));
    }, [isStreaming]);

    useEffect(() => {
      if (!isOpen) return;
      const container = scrollContainerRef.current;
      if (!container) return;
      container.scrollTop = container.scrollHeight;
    }, [isOpen, steps.length]);

    if (steps.length === 0) return null;

    const stepsText = `${steps.length} ${steps.length === 1 ? "step" : "steps"}`;
    const elapsedText =
      isStreaming && startedAt ? ` · ${formatElapsed(elapsed)}` : "";
    const durationText = !isStreaming && duration ? ` · ${duration}` : "";
    const headerLabel = isStreaming
      ? name
        ? `${name} is working... (${stepsText}${elapsedText})`
        : `Working... (${stepsText}${elapsedText})`
      : name
        ? `${name} completed ${stepsText}${durationText}`
        : `${stepsText} completed${durationText}`;

    return (
      <ChainOfThought
        open={isOpen}
        onOpenChange={setIsOpen}
        className={cn("text-sm", className)}
        {...props}
      >
        <ChainOfThoughtHeader icon={icon}>{headerLabel}</ChainOfThoughtHeader>
        <ChainOfThoughtContentArea>
          <div
            ref={scrollContainerRef}
            className="space-y-1 max-h-64 overflow-y-auto scrollbar"
          >
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
