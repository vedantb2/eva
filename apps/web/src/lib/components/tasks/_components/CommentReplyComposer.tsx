"use client";

import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { Button } from "@conductor/ui";
import { UserInitials } from "@conductor/shared";
import { IconArrowUp } from "@tabler/icons-react";
import {
  CommentMentionInput,
  type CommentMentionInputHandle,
} from "./CommentMentionInput";

interface CommentReplyComposerProps {
  taskId: Id<"agentTasks">;
  parentId: Id<"taskComments">;
}

/**
 * Persistent thread reply input, Linear-style: the current user's avatar, a
 * single-line "Leave a reply" field that grows as you type, and an always-
 * visible send button.
 */
export function CommentReplyComposer({
  taskId,
  parentId,
}: CommentReplyComposerProps) {
  const currentUserId = useQuery(api.auth.me);
  const mentionRef = useRef<CommentMentionInputHandle>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createComment = useMutation(api.taskComments.create);

  const handleSubmit = async () => {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    const content = mentionRef.current?.tokenize(trimmed) ?? trimmed;
    setIsSubmitting(true);
    try {
      await createComment({ taskId, content, parentId });
      mentionRef.current?.reset();
      setReplyText("");
    } catch (err) {
      console.error("Failed to post reply:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-start gap-2">
      {/* Fixed slot keeps the avatar from shifting the input once it loads;
          h-9 aligns it with the input's first line when multi-line. */}
      <span className="flex h-9 w-4 shrink-0 items-center justify-center">
        {currentUserId ? (
          <UserInitials userId={currentUserId} size="sm" hideLastSeen />
        ) : null}
      </span>
      <div className="relative flex-1">
        <CommentMentionInput
          ref={mentionRef}
          value={replyText}
          onValueChange={setReplyText}
          placeholder="Leave a reply"
          className="min-h-0 max-h-36 border-0"
        />
        <Button
          type="button"
          size="icon"
          className="absolute right-1.5 bottom-1.5 h-7 w-7 rounded-full"
          disabled={!replyText.trim() || isSubmitting}
          onClick={handleSubmit}
          aria-label="Post reply"
        >
          <IconArrowUp size={16} />
        </Button>
      </div>
    </div>
  );
}
