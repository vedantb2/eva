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

/**
 * Merges comment drafts and quick-task drafts into a single list sorted by
 * most recently updated descending. Both row shapes carry a required
 * `updatedAt`, so it reads off the union without narrowing.
 */
export function mergeDrafts(
  commentDrafts: CommentDraft[],
  taskDrafts: TaskDraft[],
): DraftCardModel[] {
  const models: DraftCardModel[] = [
    ...commentDrafts.map((row): DraftCardModel => ({ source: "comment", row })),
    ...taskDrafts.map((row): DraftCardModel => ({ source: "task", row })),
  ];
  return models.sort((a, b) => b.row.updatedAt - a.row.updatedAt);
}
