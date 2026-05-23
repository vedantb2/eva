"use client";

import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { Button } from "@conductor/ui";
import { IconArrowUp } from "@tabler/icons-react";
import type { FunctionReturnType } from "convex/server";
import { formatMentionToken } from "@/lib/components/mentions/mentionToken";
import { getUserDisplayName } from "./task-detail-constants";
import {
  CommentMentionInput,
  type CommentMentionInputHandle,
} from "./CommentMentionInput";

type Users = FunctionReturnType<typeof api.users.listAll>;

interface CommentReplyComposerProps {
  taskId: Id<"agentTasks">;
  parentId: Id<"taskComments">;
  parentAuthorId: Id<"users"> | undefined;
  users: Users | undefined;
  onCancel: () => void;
}

function resolveAuthorLabel(
  users: Users | undefined,
  authorId: Id<"users"> | undefined,
): string {
  if (!authorId) return "User";
  const author = users?.find((user) => user._id === authorId);
  if (!author) return "User";
  return getUserDisplayName(author);
}

export function CommentReplyComposer({
  taskId,
  parentId,
  parentAuthorId,
  users,
  onCancel,
}: CommentReplyComposerProps) {
  const mentionRef = useRef<CommentMentionInputHandle>(null);
  const [replyText, setReplyText] = useState(() => {
    const label = resolveAuthorLabel(users, parentAuthorId);
    return `@${label} `;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createComment = useMutation(api.taskComments.create);

  const handleSubmit = async () => {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    let content = mentionRef.current?.tokenize(trimmed) ?? trimmed;
    if (parentAuthorId) {
      const label = resolveAuthorLabel(users, parentAuthorId);
      const visible = `@${label}`;
      const token = formatMentionToken(label, parentAuthorId);
      if (content.includes(visible) && !content.includes(token)) {
        content = content.replace(visible, token);
      }
    }
    setIsSubmitting(true);
    try {
      await createComment({ taskId, content, parentId });
      mentionRef.current?.reset();
      onCancel();
    } catch (err) {
      console.error("Failed to post reply:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-2 space-y-2">
      <div className="relative">
        <CommentMentionInput
          ref={mentionRef}
          value={replyText}
          onValueChange={setReplyText}
          placeholder="Write a reply..."
          className="min-h-16 max-h-36"
        />
        <Button
          type="button"
          size="icon"
          className="absolute right-2 bottom-2 h-8 w-8 rounded-full"
          disabled={!replyText.trim() || isSubmitting}
          onClick={handleSubmit}
          aria-label="Post reply"
        >
          <IconArrowUp size={16} />
        </Button>
      </div>
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
