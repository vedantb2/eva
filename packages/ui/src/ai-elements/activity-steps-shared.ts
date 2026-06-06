import type { ComponentProps, ReactNode } from "react";

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
    | "question"
    | "tool";
  label: string;
  detail?: string;
  status: "complete" | "active";
}

export type ActivityStepsVariant = "task" | "timeline";

export interface ActivityStepsBaseProps extends ComponentProps<"div"> {
  steps: ActivityStep[];
  isStreaming?: boolean;
  name?: string;
  icon?: ReactNode;
  startedAt?: number;
  duration?: string;
}

export interface ActivityStepsViewProps extends ActivityStepsBaseProps {
  headerLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
