import type { Id } from "../_generated/dataModel";

/** Per-run automation branch so each run can open a fresh PR. */
export function buildAutomationRunBranchName(
  automationId: Id<"automations">,
  runId: Id<"automationRuns">,
): string {
  return `eva/automation-${String(automationId)}-${String(runId)}`;
}

/** Project sandbox branch; v2+ after merge so the next cycle gets a new name. */
export function buildProjectBranchName(
  projectId: Id<"projects">,
  branchVersion?: number,
): string {
  const version = branchVersion ?? 1;
  if (version <= 1) {
    return `eva/project-${projectId}`;
  }
  return `eva/project-${projectId}-v${version}`;
}
