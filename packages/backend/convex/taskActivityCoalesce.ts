/** Collapse rapid same-field edits into one timeline row. */
export const TASK_ACTIVITY_COALESCE_MS = 5 * 60 * 1000;

export type TaskActivityCoalesceCandidate = {
  field: string;
  userId: string | undefined;
  createdAt: number;
};

/** True when `existing` is the same actor+field and still inside the coalesce window. */
export function shouldCoalesceTaskActivity(
  existing: TaskActivityCoalesceCandidate,
  next: { field: string; userId: string | undefined; now: number },
): boolean {
  if (existing.field !== next.field) return false;
  if ((existing.userId ?? "") !== (next.userId ?? "")) return false;
  return next.now - existing.createdAt <= TASK_ACTIVITY_COALESCE_MS;
}
