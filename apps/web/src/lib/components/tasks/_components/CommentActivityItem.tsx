"use client";

import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import type { FunctionReturnType } from "convex/server";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import dayjs from "@conductor/shared/dates";
import { UserInitials } from "@conductor/shared";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@conductor/ui";
import { IconDots, IconPencil, IconTrash } from "@tabler/icons-react";
import { mentionTokensToEditableText } from "@/lib/components/mentions/mentionToken";
import { UserMentionText } from "@/lib/components/mentions";
import { getUserDisplayName } from "./task-detail-constants";
import {
  CommentMentionInput,
  type CommentMentionInputHandle,
} from "./CommentMentionInput";

type Comment = FunctionReturnType<typeof api.taskComments.listByTask>[number];
type Users = FunctionReturnType<typeof api.users.listAll>;

interface CommentActivityItemProps {
  comment: Comment;
  taskId: Id<"agentTasks">;
  users: Users | undefined;
  onDeleteRequest: (commentId: Id<"taskComments">) => void;
}

function CommentAuthorName({
  authorId,
  users,
}: {
  authorId: Id<"users">;
  users: Users | undefined;
}) {
  const fromList = users?.find((user) => user._id === authorId);
  const profile = useQuery(api.users.get, fromList ? "skip" : { id: authorId });

  if (fromList) {
    return (
      <span className="truncate text-sm font-medium text-foreground">
        {getUserDisplayName(fromList)}
      </span>
    );
  }

  if (profile === undefined) {
    return (
      <span className="truncate text-sm font-medium text-muted-foreground">
        ...
      </span>
    );
  }

  if (profile === null) {
    return (
      <span className="truncate text-sm font-medium text-foreground">
        Unknown
      </span>
    );
  }

  return (
    <span className="truncate text-sm font-medium text-foreground">
      {getUserDisplayName(profile)}
    </span>
  );
}

export function CommentActivityItem({
  comment,
  taskId,
  users,
  onDeleteRequest,
}: CommentActivityItemProps) {
  const currentUserId = useQuery(api.auth.me);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const editMentionRef = useRef<CommentMentionInputHandle>(null);

  const updateComment = useMutation(
    api.taskComments.update,
  ).withOptimisticUpdate((localStore, args) => {
    const current = localStore.getQuery(api.taskComments.listByTask, {
      taskId,
    });
    if (current === undefined) return;
    localStore.setQuery(
      api.taskComments.listByTask,
      { taskId },
      current.map((entry) =>
        entry._id === args.id ? { ...entry, content: args.content } : entry,
      ),
    );
  });

  const isAuthor =
    comment.authorId !== undefined && comment.authorId === currentUserId;

  const startEditing = () => {
    setEditText(mentionTokensToEditableText(comment.content));
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditText("");
    editMentionRef.current?.reset();
  };

  const saveEdit = async () => {
    const trimmed = editText.trim();
    if (!trimmed) return;
    const content = editMentionRef.current?.tokenize(trimmed) ?? trimmed;
    setIsSaving(true);
    try {
      await updateComment({ id: comment._id, content });
      editMentionRef.current?.reset();
      setIsEditing(false);
      setEditText("");
    } catch (err) {
      console.error("Failed to update comment:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-2 rounded-lg bg-muted/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {comment.authorId ? (
            <UserInitials userId={comment.authorId} size="sm" />
          ) : null}
          <div className="flex min-w-0 items-baseline gap-1.5">
            {comment.authorId ? (
              <CommentAuthorName authorId={comment.authorId} users={users} />
            ) : (
              <span className="truncate text-sm font-medium text-foreground">
                Unknown
              </span>
            )}
            <span className="shrink-0 text-[11px] text-muted-foreground/60 tabular-nums">
              {dayjs(comment.createdAt).fromNow()}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground"
                aria-label="Comment options"
              >
                <IconDots size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isAuthor ? (
                <DropdownMenuItem onClick={startEditing}>
                  <IconPencil size={14} />
                  Edit
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDeleteRequest(comment._id)}
              >
                <IconTrash size={14} />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <CommentMentionInput
            ref={editMentionRef}
            value={editText}
            onValueChange={setEditText}
            placeholder="Edit comment..."
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={cancelEditing}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={saveEdit}
              disabled={isSaving || editText.trim() === ""}
            >
              Save
            </Button>
          </div>
        </div>
      ) : (
        <UserMentionText text={comment.content} />
      )}
    </div>
  );
}
