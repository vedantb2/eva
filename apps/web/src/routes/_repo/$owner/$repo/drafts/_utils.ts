import type { FunctionReturnType } from "convex/server";
import { api } from "@conductor/backend";
import { mentionTokensToEditableText } from "@/lib/components/mentions/mentionToken";

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

/**
 * Converts tokenized content (mention + skill tokens) to plain readable text.
 * Handles both `@[Label](id)` mention tokens and `/[Label](id)` skill tokens.
 */
export function detokenize(content: string): string {
  // First convert @[Label](id) → @Label
  const withMentions = mentionTokensToEditableText(content);
  // Then convert /[Label](id) → /Label
  return withMentions.replace(
    /\/\[([^\]]{1,200})\]\(([a-z0-9_]{16,40})\)/g,
    (_match, label: string) => `/${label}`,
  );
}
