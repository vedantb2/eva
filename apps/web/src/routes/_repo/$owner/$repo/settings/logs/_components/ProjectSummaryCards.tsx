"use client";

import type { FunctionReturnType } from "convex/server";
import type { api } from "@eva/backend";
import { SettingsSection } from "@/lib/components/settings/SettingsSection";
import { formatCost } from "../_utils";
import { SummaryStat } from "./SummaryStat";

type ProjectLogGroup = FunctionReturnType<typeof api.logs.listByProject>[number];
type LogEntry = ProjectLogGroup["logs"][number];

interface ProjectGroupSummary {
  // totalCost is derived client-side (summed per-log cost), not part of the
  // listByProject return shape — only `logs` comes straight off the query.
  totalCost: number;
  logs: LogEntry[];
}

interface ProjectSummaryCardsProps {
  groups: ProjectGroupSummary[];
}

export function ProjectSummaryCards({ groups }: ProjectSummaryCardsProps) {
  const totalCost = groups.reduce((sum, g) => sum + g.totalCost, 0);
  const totalLogs = groups.reduce((sum, g) => sum + g.logs.length, 0);

  return (
    <SettingsSection title="Summary" bodyVariant="compact">
      <div className="grid grid-cols-3 gap-4">
        <SummaryStat label="Project spending" value={formatCost(totalCost)} />
        <SummaryStat label="Projects" value={String(groups.length)} />
        <SummaryStat label="Completions" value={String(totalLogs)} />
      </div>
    </SettingsSection>
  );
}
