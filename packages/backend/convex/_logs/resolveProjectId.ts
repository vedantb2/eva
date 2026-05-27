import type { QueryCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

/** Log entity types whose entityId is an agentTasks document id. */
const TASK_SCOPED_ENTITY_TYPES = new Set([
  "quickTask",
  "taskAudit",
  "task-chat",
]);

type LogRow = Pick<Doc<"logs">, "entityType" | "entityId" | "projectId">;

/** Loads projectId from the linked agent task when a log row was written before
 *  project tagging existed (or before the task was assigned to a project). */
export async function buildTaskProjectIdLookup(
  ctx: QueryCtx,
  entries: LogRow[],
): Promise<Map<string, Id<"projects">>> {
  const taskIds = new Set<Id<"agentTasks">>();

  for (const entry of entries) {
    if (entry.projectId !== undefined) continue;
    if (!TASK_SCOPED_ENTITY_TYPES.has(entry.entityType)) continue;
    const taskId = ctx.db.normalizeId("agentTasks", entry.entityId);
    if (taskId) taskIds.add(taskId);
  }

  const projectByTaskId = new Map<string, Id<"projects">>();
  for (const taskId of taskIds) {
    const task = await ctx.db.get(taskId);
    if (task?.projectId !== undefined) {
      projectByTaskId.set(String(taskId), task.projectId);
    }
  }

  return projectByTaskId;
}

export function resolveLogProjectId(
  ctx: QueryCtx,
  entry: LogRow,
  projectByTaskId: Map<string, Id<"projects">>,
): Id<"projects"> | undefined {
  if (entry.projectId !== undefined) {
    return entry.projectId;
  }
  if (!TASK_SCOPED_ENTITY_TYPES.has(entry.entityType)) {
    return undefined;
  }
  const taskId = ctx.db.normalizeId("agentTasks", entry.entityId);
  if (!taskId) {
    return undefined;
  }
  return projectByTaskId.get(String(taskId));
}
