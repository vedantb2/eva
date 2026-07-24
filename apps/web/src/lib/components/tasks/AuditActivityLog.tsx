"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import { ActivityTasks, Spinner } from "@eva/ui";
import { parseActivitySteps } from "@eva/shared/parseActivitySteps";

interface AuditActivityLogProps {
  runId: Id<"agentRuns">;
  type: "audit" | "fix";
}

export function AuditActivityLog({ runId, type }: AuditActivityLogProps) {
  const activityLog = useQuery(api.audits.getActivityLog, { runId, type });
  if (activityLog === undefined) return <Spinner size="sm" />;
  if (activityLog === null) return null;
  const steps = parseActivitySteps(activityLog);
  return steps ? <ActivityTasks steps={steps} /> : null;
}
