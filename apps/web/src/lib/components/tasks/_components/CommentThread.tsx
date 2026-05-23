"use client";

import type { Id } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@conductor/backend";
import { CommentActivityItem } from "./CommentActivityItem";
import { CommentReplyComposer } from "./CommentReplyComposer";
import type { TaskComment } from "../_utils/commentThread";

type Users = FunctionReturnType<typeof api.users.listAll>;

interface CommentThreadProps {
  comment: TaskComment;
  taskId: Id<"agentTasks">;
  users: Users | undefined;
  repliesByParentId: Map<Id<"taskComments">, TaskComment[]>;
  replyingToId: Id<"taskComments"> | null;
  onReplyingToChange: (commentId: Id<"taskComments"> | null) => void;
  onDeleteRequest: (commentId: Id<"taskComments">) => void;
  depth?: number;
}

export function CommentThread({
  comment,
  taskId,
  users,
  repliesByParentId,
  replyingToId,
  onReplyingToChange,
  onDeleteRequest,
  depth = 0,
}: CommentThreadProps) {
  const replies = repliesByParentId.get(comment._id) ?? [];
  const isReplyingHere = replyingToId === comment._id;

  const handleReply = () => {
    onReplyingToChange(comment._id);
  };

  const childThreads = replies.map((reply) => (
    <CommentThread
      key={reply._id}
      comment={reply}
      taskId={taskId}
      users={users}
      repliesByParentId={repliesByParentId}
      replyingToId={replyingToId}
      onReplyingToChange={onReplyingToChange}
      onDeleteRequest={onDeleteRequest}
      depth={depth + 1}
    />
  ));

  if (depth === 0) {
    return (
      <div className="space-y-0">
        <CommentActivityItem
          comment={comment}
          taskId={taskId}
          users={users}
          depth={depth}
          onReply={handleReply}
          onDeleteRequest={onDeleteRequest}
        />
        {isReplyingHere ? (
          <div className="px-3 pb-3">
            <CommentReplyComposer
              taskId={taskId}
              parentId={comment._id}
              parentAuthorId={comment.authorId}
              users={users}
              onCancel={() => onReplyingToChange(null)}
            />
          </div>
        ) : null}
        {replies.length > 0 ? (
          <div className="space-y-3 px-3 pb-3">{childThreads}</div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3 pl-4">
      <CommentActivityItem
        comment={comment}
        taskId={taskId}
        users={users}
        depth={depth}
        onReply={handleReply}
        onDeleteRequest={onDeleteRequest}
      />
      {isReplyingHere ? (
        <CommentReplyComposer
          taskId={taskId}
          parentId={comment._id}
          parentAuthorId={comment.authorId}
          users={users}
          onCancel={() => onReplyingToChange(null)}
        />
      ) : null}
      {childThreads}
    </div>
  );
}
