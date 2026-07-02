"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { ActivityTasks, Spinner } from "@conductor/ui";
import { parseActivitySteps } from "@conductor/shared/parseActivitySteps";

export function RunActivityLog({
  runId,
  isActive,
}: {
  runId: Id<"agentRuns">;
  isActive?: boolean;
}) {
  const activityLog = useQuery(
    api.agentRuns.getActivityLog,
    isActive ? "skip" : { id: runId },
  );
  if (isActive) return null;
  if (activityLog === undefined) return <Spinner size="sm" />;
  if (activityLog === null) return null;
  const steps = parseActivitySteps(activityLog);
  return steps ? <ActivityTasks steps={steps} /> : null;
}
