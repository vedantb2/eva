"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { ActivitySteps, Spinner } from "@conductor/ui";
import { parseActivitySteps } from "@/lib/utils/parseActivitySteps";

interface AuditActivityLogProps {
  runId: Id<"agentRuns">;
  type: "audit" | "fix";
}

export function AuditActivityLog({ runId, type }: AuditActivityLogProps) {
  const activityLog = useQuery(api.audits.getActivityLog, { runId, type });
  if (activityLog === undefined) return <Spinner size="sm" />;
  if (activityLog === null) return null;
  const steps = parseActivitySteps(activityLog);
  return steps ? <ActivitySteps steps={steps} /> : null;
}
