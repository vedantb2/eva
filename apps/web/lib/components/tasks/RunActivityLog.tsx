"use client";

import { useQuery } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { ActivitySteps, Spinner } from "@conductor/ui";
import { parseActivitySteps } from "@/lib/utils/parseActivitySteps";

export function RunActivityLog({ runId }: { runId: Id<"agentRuns"> }) {
  const activityLog = useQuery(api.agentRuns.getActivityLog, { id: runId });
  if (activityLog === undefined) return <Spinner size="sm" />;
  if (activityLog === null) return null;
  const steps = parseActivitySteps(activityLog);
  return steps ? <ActivitySteps steps={steps} /> : null;
}
