import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { agentTaskFields } from "../validators";

/** Deduplicates and trims an array of tags, preserving order. */
export function normalizeTaskTags(
  tags: string[] | undefined,
): string[] | undefined {
  if (tags === undefined) {
    return undefined;
  }
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const rawTag of tags) {
    const tag = rawTag.trim();
    if (!tag || seen.has(tag)) {
      continue;
    }
    seen.add(tag);
    normalized.push(tag);
  }
  return normalized;
}

/** Builds a human-readable notification message for task assignment or completion. */
export function buildTaskNotificationMessage(
  task: {
    projectId?: Id<"projects">;
    status: string;
    description?: string;
    taskNumber?: number;
  },
  action: "assigned" | "done",
): string {
  const scopeLabel = task.projectId ? "Project task" : "Quick task";
  const taskNumberLabel =
    task.taskNumber === undefined ? "" : `Task #${task.taskNumber}. `;
  const description = task.description?.trim();
  const summary =
    description && description.length > 180
      ? `${description.slice(0, 177)}...`
      : description;
  if (action === "assigned") {
    const message = `${scopeLabel}. ${taskNumberLabel}Status: ${task.status.replace(/_/g, " ")}.`;
    return summary ? `${message} ${summary}` : message;
  }
  const message = `${scopeLabel}. ${taskNumberLabel}Status changed to done.`;
  return summary ? `${message} ${summary}` : message;
}

/** Convex validator for a full agent task document including system fields. */
export const agentTaskValidator = v.object({
  _id: v.id("agentTasks"),
  _creationTime: v.number(),
  ...agentTaskFields,
});
