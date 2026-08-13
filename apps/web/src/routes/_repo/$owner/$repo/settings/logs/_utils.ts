import {
  parseResultEvent,
  formatCost,
  formatTokens,
} from "@/lib/utils/logs";

export { parseResultEvent, formatCost, formatTokens };

const ENTITY_TYPE_LABELS: Record<string, string> = {
  quickTask: "Quick Tasks",
  session: "Sessions",
  project: "Projects",
  "project-chat": "Project Chats",
  "task-chat": "Task Chats",
  doc: "Docs",
  evaluation: "Evaluations",
  summarize: "Summaries",
  testGen: "Test Generation",
  automation: "Automations",
};

export function labelFor(entityType: string): string {
  return ENTITY_TYPE_LABELS[entityType] ?? entityType;
}

// Group key used by the "By Type" log view. Project-tagged entries (chats,
// tasks, interviews) collapse into a single "project" group so projects are
// billed as one line instead of split across project-chat + quickTask etc.
const PROJECT_GROUP_KEY = "project";

export function groupKeyFor(log: {
  entityType: string;
  projectId?: string;
}): string {
  return log.projectId !== undefined ? PROJECT_GROUP_KEY : log.entityType;
}

interface LogCostFields {
  entityType: string;
  projectId?: string;
  rawResultEvent?: string;
}

export interface LogTotals {
  totalCost: number;
  totalInput: number;
  totalOutput: number;
  totalDuration: number;
}

/** Cost, tokens, and duration for a set of completions. */
export function logTotals(logs: ReadonlyArray<LogCostFields>): LogTotals {
  let totalCost = 0;
  let totalInput = 0;
  let totalOutput = 0;
  let totalDuration = 0;
  for (const log of logs) {
    const parsed = parseResultEvent(log.rawResultEvent);
    totalCost += parsed.costUsd;
    totalInput += parsed.inputTokens;
    totalOutput += parsed.outputTokens;
    totalDuration += parsed.durationMs;
  }
  return { totalCost, totalInput, totalOutput, totalDuration };
}

/** Completions rolled up by type, spend-desc. */
export function groupLogsByType<T extends LogCostFields>(
  logs: T[],
): Array<{ type: string; logs: T[]; total: number }> {
  const groups = new Map<string, { logs: T[]; total: number }>();
  for (const log of logs) {
    const key = groupKeyFor(log);
    const cost = parseResultEvent(log.rawResultEvent).costUsd;
    const existing = groups.get(key);
    if (existing) {
      existing.logs.push(log);
      existing.total += cost;
    } else {
      groups.set(key, { logs: [log], total: cost });
    }
  }
  return Array.from(groups.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .map(([type, data]) => ({ type, ...data }));
}
