import type { FunctionReturnType } from "convex/server";
import type { api, Id } from "@conductor/backend";

export type TaskComment = FunctionReturnType<
  typeof api.taskComments.listByTask
>[number];

export const DELETED_COMMENT_PLACEHOLDER =
  "This comment has been deleted by the author";

export function isCommentDeleted(comment: TaskComment): boolean {
  return comment.deletedAt !== undefined;
}

/** Top-level user comments for the mixed activity timeline (excludes replies and system). */
export function getTopLevelComments(comments: TaskComment[]): TaskComment[] {
  return comments.filter((comment) => comment.authorId && !comment.parentId);
}

/** Direct replies grouped by parent id, oldest first within each thread. */
export function buildRepliesByParentId(
  comments: TaskComment[],
): Map<Id<"taskComments">, TaskComment[]> {
  const map = new Map<Id<"taskComments">, TaskComment[]>();
  for (const comment of comments) {
    if (!comment.parentId) continue;
    const siblings = map.get(comment.parentId) ?? [];
    siblings.push(comment);
    map.set(comment.parentId, siblings);
  }
  for (const siblings of map.values()) {
    siblings.sort((a, b) => a.createdAt - b.createdAt);
  }
  return map;
}
