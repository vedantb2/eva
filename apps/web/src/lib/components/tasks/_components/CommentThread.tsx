"use client";

import type { Id } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@conductor/backend";
import { Separator } from "@conductor/ui";
import { CommentActivityItem } from "./CommentActivityItem";
import { CommentReplyComposer } from "./CommentReplyComposer";
import type { TaskComment } from "../_utils/commentThread";

type Users = FunctionReturnType<typeof api.users.listAll>;

interface CommentThreadProps {
  comment: TaskComment;
  taskId: Id<"agentTasks">;
  users: Users | undefined;
  repliesByParentId: Map<Id<"taskComments">, TaskComment[]>;
  onDeleteRequest: (commentId: Id<"taskComments">) => void;
  depth?: number;
}

export function CommentThread({
  comment,
  taskId,
  users,
  repliesByParentId,
  onDeleteRequest,
  depth = 0,
}: CommentThreadProps) {
  const replies = repliesByParentId.get(comment._id) ?? [];

  const childThreads = replies.map((reply) => (
    <CommentThread
      key={reply._id}
      comment={reply}
      taskId={taskId}
      users={users}
      repliesByParentId={repliesByParentId}
      onDeleteRequest={onDeleteRequest}
      depth={depth + 1}
    />
  ));

  if (depth === 0) {
    return (
      <div className="space-y-3 rounded-lg bg-muted/40 p-3">
        <CommentActivityItem
          comment={comment}
          taskId={taskId}
          users={users}
          onDeleteRequest={onDeleteRequest}
        />
        {replies.length > 0 ? (
          <div className="space-y-3">{childThreads}</div>
        ) : null}
        <div>
          <Separator className="mb-3" />
          <CommentReplyComposer taskId={taskId} parentId={comment._id} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 pl-4">
      <CommentActivityItem
        comment={comment}
        taskId={taskId}
        users={users}
        onDeleteRequest={onDeleteRequest}
      />
      {childThreads}
    </div>
  );
}
