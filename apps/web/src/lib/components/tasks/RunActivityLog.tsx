"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { ActivityTasks, Spinner } from "@conductor/ui";
import { parseActivitySteps } from "@conductor/shared/parseActivitySteps";
import { formatDuration } from "@conductor/shared/duration";

export function RunActivityLog({
  runId,
  isActive,
  finalText,
  startedAt,
  finishedAt,
}: {
  runId: Id<"agentRuns">;
  isActive?: boolean;
  finalText?: string;
  startedAt?: number;
  finishedAt?: number;
}) {
  const activityLog = useQuery(
    api.agentRuns.getActivityLog,
    isActive ? "skip" : { id: runId },
  );
  if (isActive) return null;
  if (activityLog === undefined) return <Spinner size="sm" />;
  if (activityLog === null) return null;
  const steps = parseActivitySteps(activityLog);
  // Mirror the sessions view: when the run has settled, collapse the whole
  // turn's activity behind a "Worked for {duration}" fold.
  const duration =
    startedAt && finishedAt ? formatDuration(startedAt, finishedAt) : undefined;
  return steps ? (
    <ActivityTasks steps={steps} finalText={finalText} duration={duration} />
  ) : null;
}
