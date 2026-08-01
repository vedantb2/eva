"use client";

import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import type { FunctionReturnType } from "convex/server";
import { UserInitials } from "@eva/shared";
import { Button, cn, Textarea } from "@eva/ui";
import { IconCheck, IconArrowBackUp } from "@tabler/icons-react";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import { useState, useEffect, useRef } from "react";

type DocComment = FunctionReturnType<typeof api.docComments.listByDoc>[number];

export function DocCommentThread({
  root,
  replies,
  docId,
  isActive,
  isOrphaned,
  onClick,
}: {
  root: DocComment;
  replies: DocComment[];
  docId: Id<"docs">;
  isActive: boolean;
  isOrphaned: boolean;
  onClick: () => void;
}) {
  const setResolved = useMutation(api.docComments.setResolved);
  const createComment = useMutation(api.docComments.create);
  const [replyContent, setReplyContent] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const isResolved = root.resolvedAt !== undefined;

  // Bring the thread into view when its highlight is clicked in the editor.
  useEffect(() => {
    if (isActive) {
      rootRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isActive]);

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    await createComment({
      docId,
      content: replyContent.trim(),
      parentId: root._id,
    });
    setReplyContent("");
    setIsReplying(false);
  };

  return (
    <div
      ref={rootRef}
      onClick={onClick}
      className={cn(
        "border-b border-border p-3 cursor-pointer transition-colors",
        isActive && "bg-accent/50 ring-1 ring-inset ring-ring",
      )}
    >
      {root.anchorText && (
        <div className="mb-2 rounded border border-border bg-muted/50 px-2 py-1 text-xs text-muted-foreground line-clamp-2 italic">
          &ldquo;{root.anchorText}&rdquo;
        </div>
      )}
      {root.resolutionTarget === "agent" && !isResolved ? (
        <div className="mb-2 inline-flex rounded border border-border bg-primary/10 px-1.5 py-0.5 text-3xs font-medium text-primary">
          For Eva
        </div>
      ) : null}
      {isOrphaned && (
        <div className="mb-2 text-3xs font-medium uppercase tracking-wide text-warning">
          Original text deleted
        </div>
      )}

      <DocCommentItem comment={root} />

      {replies.map((reply) => (
        <div
          key={reply._id}
          className="ml-3 mt-2 border-l-2 border-border pl-2"
        >
          <DocCommentItem comment={reply} />
        </div>
      ))}

      <div className="mt-2 flex items-center gap-1">
        {!isResolved ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-1.5 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              setResolved({ id: root._id, resolved: true });
            }}
          >
            <IconCheck className="size-3" />
            Resolve
          </Button>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-1.5 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              setResolved({ id: root._id, resolved: false });
            }}
          >
            <IconArrowBackUp className="size-3" />
            Reopen
          </Button>
        )}

        {!isReplying && (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-1.5 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              setIsReplying(true);
            }}
          >
            Reply
          </Button>
        )}
      </div>

      {isReplying && (
        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
          <Textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Reply..."
            rows={2}
            className="text-sm"
            autoFocus
          />
          <div className="mt-1.5 flex justify-end gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-xs"
              onClick={() => {
                setIsReplying(false);
                setReplyContent("");
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-6 text-xs"
              disabled={!replyContent.trim()}
              onClick={handleReply}
            >
              Reply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Resolves a comment author's display name, accounting for the query's
 *  loading (undefined) and not-found (null) states. */
function authorDisplayName(
  user: FunctionReturnType<typeof api.users.get> | undefined,
): string {
  if (user === undefined) return "…";
  if (user === null) return "Unknown";
  if (user.fullName?.trim()) return user.fullName.trim();
  const parts = [user.firstName, user.lastName].filter(
    (p): p is string => typeof p === "string" && p.trim().length > 0,
  );
  if (parts.length > 0) return parts.join(" ");
  if (user.email?.trim()) return user.email.trim();
  return "Unknown";
}

function DocCommentItem({ comment }: { comment: DocComment }) {
  const isDeleted = comment.deletedAt !== undefined;
  // Cached query — dedupes with the UserInitials avatar's own users.get fetch.
  const author = useQuery(
    api.users.get,
    comment.authorId ? { id: comment.authorId } : "skip",
  );
  const name = comment.authorId ? authorDisplayName(author) : "Unknown";

  return (
    <div className="text-sm">
      <div className="flex items-center gap-1.5">
        {comment.authorId ? (
          <UserInitials userId={comment.authorId} size="sm" />
        ) : null}
        <span data-pii className="font-medium text-xs">
          {name}
        </span>
        <RelativeDateTime
          at={comment.createdAt}
          className="text-3xs text-muted-foreground"
        />
      </div>
      <p
        className={cn(
          "mt-0.5 text-xs leading-relaxed",
          isDeleted && "italic text-muted-foreground",
        )}
      >
        {comment.content}
      </p>
    </div>
  );
}
