"use client";

import type { ReactNode } from "react";
import {
  ActivityTasks,
  Reasoning,
  ReasoningTrigger,
  CollapsibleContent,
  Shimmer,
  Spinner,
  formatElapsed,
  useElapsedSeconds,
} from "@eva/ui";
import { parseActivitySteps } from "@eva/shared/parseActivitySteps";
import { formatDuration } from "@eva/shared/duration";
import { useSimpleView } from "@/lib/hooks/useSimpleView";

function SimpleViewActivityStatus({
  isStreaming,
  startedAt,
  duration,
}: {
  isStreaming: boolean;
  startedAt?: number;
  duration?: string;
}) {
  const elapsed = useElapsedSeconds(startedAt, isStreaming);
  if (isStreaming) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Spinner size="sm" />
        <Shimmer as="span" duration={2.5} spread={1.5}>
          Working for {formatElapsed(elapsed)}
        </Shimmer>
      </div>
    );
  }
  if (!duration) {
    return null;
  }
  return (
    <p className="text-muted-foreground text-sm">Worked for {duration}</p>
  );
}

export function StreamingActivityDisplay({
  activity,
  isStreaming = true,
  name,
  icon,
  thinkingLabel = "Working...",
  startedAt,
  onOpenFile,
}: {
  activity: string | undefined;
  isStreaming?: boolean;
  name?: string;
  icon?: ReactNode;
  thinkingLabel?: string;
  startedAt?: number;
  onOpenFile?: (path: string) => void;
}) {
  const simpleView = useSimpleView();
  if (simpleView) {
    return (
      <SimpleViewActivityStatus
        isStreaming={isStreaming}
        startedAt={startedAt}
      />
    );
  }

  const steps = parseActivitySteps(activity);

  return (
    <ActivityTasks
      steps={
        steps ?? [{ type: "thinking", label: thinkingLabel, status: "active" }]
      }
      isStreaming={isStreaming}
      name={name}
      icon={icon}
      startedAt={startedAt}
      onOpenFile={onOpenFile}
    />
  );
}

export function ActivityLogDisplay({
  activityLog,
  name,
  icon,
  startedAt,
  finishedAt,
  finalText,
  onOpenFile,
}: {
  activityLog: string;
  name?: string;
  icon?: ReactNode;
  startedAt?: number;
  finishedAt?: number;
  finalText?: string;
  onOpenFile?: (path: string) => void;
}) {
  const simpleView = useSimpleView();
  const duration =
    startedAt && finishedAt ? formatDuration(startedAt, finishedAt) : undefined;

  if (simpleView) {
    const trimmedLog = activityLog.trim();
    if (trimmedLog === "" || trimmedLog === "[]") {
      return null;
    }
    return (
      <SimpleViewActivityStatus isStreaming={false} duration={duration} />
    );
  }

  const steps = parseActivitySteps(activityLog);

  if (steps) {
    return (
      <ActivityTasks
        steps={steps}
        name={name}
        icon={icon}
        duration={duration}
        finalText={finalText}
        onOpenFile={onOpenFile}
      />
    );
  }

  // No parseable steps: a text-only reply (no tools) has an empty activity log
  // ("[]"). Render nothing rather than a "View logs" accordion wrapping a bare
  // "[]". The raw fallback below is only for a genuinely non-empty, unparseable
  // log (kept for debugging odd payloads).
  const trimmedLog = activityLog.trim();
  if (trimmedLog === "" || trimmedLog === "[]") {
    return null;
  }

  return (
    <Reasoning defaultOpen={false}>
      <ReasoningTrigger getThinkingMessage={() => "View logs"} />
      <CollapsibleContent className="mt-4 text-sm text-muted-foreground">
        <pre className="whitespace-pre-wrap font-mono text-xs max-h-64 overflow-y-auto scroll-fade">
          {activityLog}
        </pre>
      </CollapsibleContent>
    </Reasoning>
  );
}
