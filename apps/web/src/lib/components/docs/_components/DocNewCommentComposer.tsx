import { useMutation } from "convex/react";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import { Button, Textarea } from "@eva/ui";
import { useState } from "react";

export function DocNewCommentComposer({
  docId,
  anchorId,
  anchorText,
  allowAskEva = false,
  onCancel,
  onCreated,
}: {
  docId: Id<"docs">;
  anchorId: string;
  anchorText: string;
  allowAskEva?: boolean;
  onCancel: () => void;
  onCreated: () => void;
}) {
  const createComment = useMutation(api.docComments.create);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (resolutionTarget?: "agent" | "human") => {
    if (!content.trim()) return;
    setIsSubmitting(true);
    try {
      await createComment({
        docId,
        content: content.trim(),
        anchorId,
        anchorText,
        resolutionTarget,
      });
      setContent("");
      onCreated();
    } catch (error) {
      setIsSubmitting(false);
      throw error;
    }
    setIsSubmitting(false);
  };

  return (
    <div>
      {anchorText && (
        <div className="mb-2 rounded border border-border bg-muted/50 px-2 py-1 text-xs text-muted-foreground line-clamp-2 italic">
          &ldquo;{anchorText}&rdquo;
        </div>
      )}
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={
          allowAskEva
            ? "Comment or ask Eva to revise the recap..."
            : "Add a comment..."
        }
        rows={3}
        className="text-sm"
        autoFocus
      />
      <div className="mt-1.5 flex justify-end gap-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-6 text-xs"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        {allowAskEva ? (
          <Button
            size="sm"
            variant="secondary"
            className="h-6 text-xs"
            disabled={!content.trim() || isSubmitting}
            onClick={() => submit("agent")}
          >
            Ask Eva
          </Button>
        ) : null}
        <Button
          size="sm"
          className="h-6 text-xs"
          disabled={!content.trim() || isSubmitting}
          onClick={() => submit(allowAskEva ? "human" : undefined)}
        >
          Comment
        </Button>
      </div>
    </div>
  );
}
