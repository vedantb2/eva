import {
  IconChecklist,
  IconTerminal2,
  IconPalette,
  IconFileText,
  IconLayoutKanban,
  IconFlask,
  IconTestPipe,
  IconPlayerPlay,
} from "@tabler/icons-react";
import type { ComponentType } from "react";

// Re-export shared utils
export {
  GBP_TO_USD,
  parseResultEvent,
  getTotalInputTokens,
  formatCost,
  formatTokens,
} from "@/lib/utils/logs";

const ENTITY_TYPE_ICONS: Record<
  string,
  ComponentType<{ size?: number; className?: string }>
> = {
  quickTask: IconChecklist,
  session: IconTerminal2,
  designSession: IconPalette,
  doc: IconFileText,
  project: IconLayoutKanban,
  evaluation: IconFlask,
  testGen: IconTestPipe,
  automation: IconPlayerPlay,
  sessionAudit: IconTerminal2,
  taskAudit: IconChecklist,
  summarize: IconFileText,
};

export function iconFor(
  entityType: string,
): ComponentType<{ size?: number; className?: string }> {
  return ENTITY_TYPE_ICONS[entityType] ?? IconFileText;
}

const ENTITY_TYPE_LABELS: Record<string, string> = {
  quickTask: "Quick Tasks",
  session: "Sessions",
  designSession: "Design Sessions",
  project: "Projects",
  "project-chat": "Project Chats",
  "task-chat": "Task Chats",
  doc: "Docs",
  evaluation: "Evaluations",
  sessionAudit: "Session Audits",
  taskAudit: "Task Audits",
  summarize: "Summaries",
  testGen: "Test Generation",
  automation: "Automations",
};

export function labelFor(entityType: string): string {
  return ENTITY_TYPE_LABELS[entityType] ?? entityType;
}

// Group key used by the "By Type" log view. Project-tagged entries (chats,
// tasks, audits, interviews) collapse into a single "project" group so projects
// are billed as one line instead of split across project-chat + quickTask etc.
const PROJECT_GROUP_KEY = "project";

export function groupKeyFor(log: {
  entityType: string;
  projectId: string | undefined;
}): string {
  return log.projectId !== undefined ? PROJECT_GROUP_KEY : log.entityType;
}
