"use client";

import type { Id } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@conductor/backend";
import { Separator, cn } from "@conductor/ui";
import { CommentActivityItem } from "./CommentActivityItem";
import { CommentReplyComposer } from "./CommentReplyComposer";
import type { TaskComment } from "../_utils/commentThread";

type Users = FunctionReturnType<typeof api.users.listAll>;

/** Subtle dividers inside comment threads — tuned per theme on `bg-muted/40`. */
const THREAD_SEPARATOR_CLASS = "bg-foreground/5 dark:bg-foreground/5";

interface CommentThreadProps {
  comment: TaskComment;
  taskId: Id<"agentTasks">;
  users: Users | undefined;
  repliesByParentId: Map<Id<"taskComments">, TaskComment[]>;
  onDeleteRequest: (commentId: Id<"taskComments">) => void;
  depth?: number;
}

function ReplyThreads({
  replies,
  taskId,
  users,
  repliesByParentId,
  onDeleteRequest,
  depth,
}: {
  replies: TaskComment[];
  taskId: Id<"agentTasks">;
  users: Users | undefined;
  repliesByParentId: Map<Id<"taskComments">, TaskComment[]>;
  onDeleteRequest: (commentId: Id<"taskComments">) => void;
  depth: number;
}) {
  if (replies.length === 0) return null;

  return (
    <div className="space-y-3 pl-4">
      {replies.map((reply) => (
        <div key={reply._id} className="space-y-3">
          <Separator className={THREAD_SEPARATOR_CLASS} />
          <CommentThread
            comment={reply}
            taskId={taskId}
            users={users}
            repliesByParentId={repliesByParentId}
            onDeleteRequest={onDeleteRequest}
            depth={depth + 1}
          />
        </div>
      ))}
    </div>
  );
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

  if (depth === 0) {
    return (
      <div className="space-y-3 rounded-lg bg-muted/40 p-3">
        <CommentActivityItem
          comment={comment}
          taskId={taskId}
          users={users}
          onDeleteRequest={onDeleteRequest}
        />
        <ReplyThreads
          replies={replies}
          taskId={taskId}
          users={users}
          repliesByParentId={repliesByParentId}
          onDeleteRequest={onDeleteRequest}
          depth={depth}
        />
        <div>
          <Separator className={cn("mb-3", THREAD_SEPARATOR_CLASS)} />
          <CommentReplyComposer taskId={taskId} parentId={comment._id} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <CommentActivityItem
        comment={comment}
        taskId={taskId}
        users={users}
        onDeleteRequest={onDeleteRequest}
      />
      <ReplyThreads
        replies={replies}
        taskId={taskId}
        users={users}
        repliesByParentId={repliesByParentId}
        onDeleteRequest={onDeleteRequest}
        depth={depth}
      />
    </div>
  );
}
