import { v } from "convex/values";
import {
  accentColorValidator,
  auditSeverityValidator,
  findingSeverityValidator,
  fontFamilyValidator,
  letterSpacingValidator,
  logLevelValidator,
  radiusValidator,
  roleValidator,
} from "./enums";

export const workflowCompleteValidator = v.object({
  success: v.boolean(),
  result: v.union(v.string(), v.null()),
  error: v.union(v.string(), v.null()),
  activityLog: v.union(v.string(), v.null()),
  pendingQuestion: v.optional(v.string()),
});

export const evalResultValidator = v.object({
  requirement: v.string(),
  passed: v.boolean(),
  detail: v.string(),
  severity: v.optional(auditSeverityValidator),
});

/**
 * A single issue flagged by a testing-arena run. Unlike evalResultValidator this
 * is not tied to a fixed requirement list: the agent returns however many issues
 * it finds, ranked by severity. `taskId` marks an issue already converted to a task.
 */
export const evalIssueValidator = v.object({
  id: v.string(),
  title: v.string(),
  description: v.string(),
  severity: auditSeverityValidator,
  filePaths: v.optional(v.array(v.string())),
  suggestedFix: v.optional(v.string()),
  taskId: v.optional(v.id("agentTasks")),
});

export const auditSectionValidator = v.object({
  name: v.string(),
  results: v.array(evalResultValidator),
});

/** A single failed audit requirement selected for the fix flow. */
export const auditFailureValidator = v.object({
  section: v.string(),
  requirement: v.string(),
  detail: v.string(),
  severity: auditSeverityValidator,
});

export const userFlowValidator = v.object({
  name: v.string(),
  steps: v.array(v.string()),
});

export const variationValidator = v.object({
  label: v.string(),
  route: v.optional(v.string()),
  filePath: v.optional(v.string()),
});

export const customThemeValidator = v.object({
  accentColor: v.optional(accentColorValidator),
  radius: v.optional(radiusValidator),
  fontFamily: v.optional(fontFamilyValidator),
  letterSpacing: v.optional(letterSpacingValidator),
});

export const logEntryValidator = v.object({
  timestamp: v.number(),
  level: logLevelValidator,
  message: v.string(),
});

export const terminalPaneValidator = v.object({
  id: v.string(),
  title: v.string(),
  createdAt: v.number(),
});

export const conversationMessageValidator = v.object({
  role: roleValidator,
  content: v.string(),
  activityLog: v.optional(v.string()),
  userId: v.optional(v.id("users")),
  // Set when the assistant placeholder is inserted; cleared at completion.
  // Used by the project interview UI to show a live timer on the activity
  // accordion (matching tasks/sessions chat behaviour).
  startedAt: v.optional(v.number()),
  finishedAt: v.optional(v.number()),
});

export const automationFindingValidator = v.object({
  id: v.string(),
  title: v.string(),
  description: v.string(),
  severity: findingSeverityValidator,
  filePaths: v.optional(v.array(v.string())),
  suggestedFix: v.optional(v.string()),
  taskId: v.optional(v.id("agentTasks")),
});

// Task-count breakdown for a project, used by both the single-project
// (getTaskProgress) and batched (listTaskProgress) queries. Defined once so the
// two return shapes never drift apart.
export const taskProgressFields = {
  total: v.number(),
  todo: v.number(),
  in_progress: v.number(),
  code_review: v.number(),
  business_review: v.number(),
  done: v.number(),
  cancelled: v.number(),
};

export const taskProgressValidator = v.object(taskProgressFields);
