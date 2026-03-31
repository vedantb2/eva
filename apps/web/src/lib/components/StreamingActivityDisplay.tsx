import type { ReactNode } from "react";
import {
  ActivitySteps,
  Reasoning,
  ReasoningTrigger,
  CollapsibleContent,
} from "@conductor/ui";
import { parseActivitySteps } from "@/lib/utils/parseActivitySteps";
import { formatDuration } from "@/lib/utils/formatDuration";

export function StreamingActivityDisplay({
  activity,
  isStreaming = true,
  name,
  icon,
  thinkingLabel = "Working...",
  startedAt,
}: {
  activity: string | undefined;
  isStreaming?: boolean;
  name?: string;
  icon?: ReactNode;
  thinkingLabel?: string;
  startedAt?: number;
}) {
  const steps = parseActivitySteps(activity);

  return (
    <ActivitySteps
      steps={
        steps ?? [{ type: "thinking", label: thinkingLabel, status: "active" }]
      }
      isStreaming={isStreaming}
      name={name}
      icon={icon}
      startedAt={startedAt}
    />
  );
}

export function ActivityLogDisplay({
  activityLog,
  name,
  icon,
  startedAt,
  finishedAt,
}: {
  activityLog: string;
  name?: string;
  icon?: ReactNode;
  startedAt?: number;
  finishedAt?: number;
}) {
  const steps = parseActivitySteps(activityLog);
  const duration =
    startedAt && finishedAt ? formatDuration(startedAt, finishedAt) : undefined;

  if (steps) {
    return (
      <ActivitySteps
        steps={steps}
        name={name}
        icon={icon}
        duration={duration}
      />
    );
  }

  return (
    <Reasoning defaultOpen={false}>
      <ReasoningTrigger getThinkingMessage={() => "View logs"} />
      <CollapsibleContent className="mt-4 text-sm text-muted-foreground">
        <pre className="whitespace-pre-wrap font-mono text-xs max-h-64 overflow-y-auto">
          {activityLog}
        </pre>
      </CollapsibleContent>
    </Reasoning>
  );
}
