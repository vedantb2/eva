/** Kinds selectable from the Data `@` mention picker (excludes People). */
export const DATA_MENTION_KINDS = [
  "document",
  "session",
  "project",
  "quickTask",
] as const;

export type DataMentionKind = (typeof DATA_MENTION_KINDS)[number];

/** Human-readable badge labels shown in the picker UI. */
export const DATA_MENTION_BADGE: Record<DataMentionKind, string> = {
  document: "Document",
  session: "Session",
  project: "Project",
  quickTask: "Quick task",
};

/** Convex table each Data kind maps to (for MCP / navigate hints). */
export const DATA_MENTION_TABLE: Record<DataMentionKind, string> = {
  document: "docs",
  session: "sessions",
  project: "projects",
  quickTask: "agentTasks",
};
