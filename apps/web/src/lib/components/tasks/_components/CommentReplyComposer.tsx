"use client";

import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { UserInitials } from "@conductor/shared";
import {
  CommentMentionInput,
  type CommentMentionInputHandle,
} from "./CommentMentionInput";
import { CommentSendButton } from "./CommentSendButton";

interface CommentReplyComposerProps {
  taskId: Id<"agentTasks">;
  parentId: Id<"taskComments">;
}

/**
 * Persistent thread reply input, Linear-style: the current user's avatar, a
 * single-line "Leave a reply" field that grows as you type, and an always-
 * visible send button. Enter submits; Shift+Enter inserts a newline.
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

  const canSubmit = replyText.trim().length > 0 && !isSubmitting;

  const handleSubmit = async () => {
    const trimmed = replyText.trim();
    if (!trimmed || isSubmitting) return;
    const content = mentionRef.current?.tokenize(trimmed) ?? trimmed;
    setIsSubmitting(true);
    try {
      await createComment({ taskId, content, parentId });
      mentionRef.current?.reset();
      setReplyText("");
      // Keep focus so a follow-up reply can be typed without re-clicking.
      mentionRef.current?.focus();
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
          onEnterSubmit={handleSubmit}
          placeholder="Leave a reply"
          className="min-h-0 max-h-36 border-0 bg-transparent transition-[background-color] hover:bg-background/40"
        />
        <CommentSendButton
          className="absolute right-1.5 bottom-1.5"
          disabled={!canSubmit}
          isSubmitting={isSubmitting}
          onClick={handleSubmit}
          ariaLabel="Post reply"
        />
      </div>
    </div>
  );
}
