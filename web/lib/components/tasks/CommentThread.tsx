"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { GenericId as Id } from "convex/values";
import { api } from "@/api";
import { IconSend, IconTrash } from "@tabler/icons-react";

interface CommentThreadProps {
  taskId: Id<"agentTasks">;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}

export function CommentThread({ taskId }: CommentThreadProps) {
  const { user } = useUser();
  const comments = useQuery(api.taskComments.listByTask, { taskId });
  const createComment = useMutation(api.taskComments.create);
  const removeComment = useMutation(api.taskComments.remove);

  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;
    setIsSubmitting(true);
    await createComment({ taskId, content: content.trim() });
    setContent("");
    setIsSubmitting(false);
  };

  const handleRemove = async (id: Id<"taskComments">) => {
    await removeComment({ id });
  };

  if (comments === undefined) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-600" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
        Comments ({comments.length})
      </h4>

      {comments.length === 0 && (
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          No comments yet
        </p>
      )}

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {comments.map((comment) => {
          const isAuthor = user?.id === comment.authorId;
          return (
            <div
              key={comment._id}
              className="group p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                  <p className="mt-1 text-xs text-neutral-400">
                    {formatDate(comment.createdAt)}
                  </p>
                </div>
                {isAuthor && (
                  <button
                    onClick={() => handleRemove(comment._id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-500 transition-opacity"
                  >
                    <IconTrash size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-end gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Add a comment..."
          className="flex-1 px-3 py-2 text-sm bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 resize-none"
          rows={2}
        />
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
          className="p-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <IconSend size={18} />
        </button>
      </div>
    </div>
  );
}
