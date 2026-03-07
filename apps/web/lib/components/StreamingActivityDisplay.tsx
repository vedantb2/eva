import type { ReactNode } from "react";
import {
  ActivitySteps,
  Reasoning,
  ReasoningTrigger,
  CollapsibleContent,
} from "@conductor/ui";
import { parseActivitySteps } from "@/lib/utils/parseActivitySteps";

export function StreamingActivityDisplay({
  activity,
  isStreaming = true,
  name,
  icon,
  thinkingLabel = "Working...",
}: {
  activity: string | undefined;
  isStreaming?: boolean;
  name?: string;
  icon?: ReactNode;
  thinkingLabel?: string;
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
    />
  );
}

export function ActivityLogDisplay({
  activityLog,
  name,
  icon,
}: {
  activityLog: string;
  name?: string;
  icon?: ReactNode;
}) {
  const steps = parseActivitySteps(activityLog);

  if (steps) {
    return <ActivitySteps steps={steps} name={name} icon={icon} />;
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
