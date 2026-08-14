import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { agentTaskFields } from "../validators";

type TaskStatus = Doc<"agentTasks">["status"];

/**
 * Chat turns used to leave the task on `todo` while the agent was working.
 * Promote only from `todo` — review/done/draft stay put. The matching
 * restore (`todoWhenChatEnds`) drops back when the turn ends so the
 * in-progress beam does not spin on an idle card.
 */
export function inProgressWhenChatStarts(
  status: TaskStatus,
): "in_progress" | undefined {
  return status === "todo" ? "in_progress" : undefined;
}

/** Restore `todo` after a chat turn unless a main run is still going. */
export function todoWhenChatEnds(task: {
  status: TaskStatus;
  activeWorkflowId?: string;
  hasActiveRun: boolean;
}): "todo" | undefined {
  if (task.status !== "in_progress") return undefined;
  if (task.activeWorkflowId !== undefined) return undefined;
  if (task.hasActiveRun) return undefined;
  return "todo";
}

/**
 * Model traits for the task's runs, shared by every mutation that writes them.
 * Absent = no change on update, and the model's own default at creation — the
 * traits menu always sends a concrete value, so there is no "clear" case.
 */
export const runTraitFields = {
  reasoningLevel: agentTaskFields.reasoningLevel,
  thinkingEnabled: agentTaskFields.thinkingEnabled,
  use1mContext: agentTaskFields.use1mContext,
  fastMode: agentTaskFields.fastMode,
};

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
  const statusPart =
    action === "assigned"
      ? `Status: ${task.status.replace(/_/g, " ")}.`
      : "Status changed to done.";
  const message = `${scopeLabel}. ${taskNumberLabel}${statusPart}`;
  return summary ? `${message} ${summary}` : message;
}

/** Convex validator for a full agent task document including system fields. */
export const agentTaskValidator = v.object({
  _id: v.id("agentTasks"),
  _creationTime: v.number(),
  ...agentTaskFields,
});
