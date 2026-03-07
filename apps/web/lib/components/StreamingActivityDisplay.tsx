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
  doneLabel = "Processing complete",
}: {
  activity: string | undefined;
  isStreaming?: boolean;
  name?: string;
  icon?: ReactNode;
  thinkingLabel?: string;
  doneLabel?: string;
}) {
  const steps = parseActivitySteps(activity);

  if (steps) {
    return (
      <ActivitySteps
        steps={steps}
        isStreaming={isStreaming}
        name={name}
        icon={icon}
      />
    );
  }

  return (
    <Reasoning isStreaming={isStreaming} defaultOpen>
      <ReasoningTrigger
        getThinkingMessage={(streaming) =>
          streaming ? thinkingLabel : doneLabel
        }
      />
      {activity && (
        <CollapsibleContent className="mt-4 text-sm text-muted-foreground">
          <pre className="whitespace-pre-wrap font-mono text-xs">
            {activity}
          </pre>
        </CollapsibleContent>
      )}
    </Reasoning>
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
