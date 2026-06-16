import type { FunctionReturnType } from "convex/server";
import { api } from "@conductor/backend";

export type CommentDraft = FunctionReturnType<
  typeof api.drafts.listForRepo
>[number];

export type TaskDraft = FunctionReturnType<
  typeof api.agentTasks.listDrafts
>[number];

export type DraftCardModel =
  | { source: "comment"; row: CommentDraft }
  | { source: "task"; row: TaskDraft };

/** Returns the effective sort timestamp for a draft card model. */
function effectiveTimestamp(model: DraftCardModel): number {
  if (model.source === "comment") {
    return model.row.updatedAt;
  }
  // agentTask drafts always have updatedAt (it is a required field)
  return model.row.updatedAt;
}

/**
 * Merges comment drafts and quick-task drafts into a single list sorted by
 * most recently updated descending.
 */
export function mergeDrafts(
  commentDrafts: CommentDraft[],
  taskDrafts: TaskDraft[],
): DraftCardModel[] {
  const models: DraftCardModel[] = [
    ...commentDrafts.map((row): DraftCardModel => ({ source: "comment", row })),
    ...taskDrafts.map((row): DraftCardModel => ({ source: "task", row })),
  ];
  return models.sort((a, b) => effectiveTimestamp(b) - effectiveTimestamp(a));
}
