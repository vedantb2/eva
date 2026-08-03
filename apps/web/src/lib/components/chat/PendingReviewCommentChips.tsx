"use client";

import { Button, Tooltip, TooltipContent, TooltipTrigger } from "@eva/ui";
import { IconMessage, IconX } from "@tabler/icons-react";
import { usePendingReviewComments } from "@/lib/contexts/PendingReviewCommentsContext";
import { useDiffSearchParams } from "@/lib/components/sandbox/useDiffSearchParams";

export function PendingReviewCommentChips() {
  const review = usePendingReviewComments();
  const { setDiffFile } = useDiffSearchParams();

  if (!review || review.comments.length === 0) return null;

  return (
    <div className="mb-2 flex flex-wrap gap-1.5">
      {review.comments.map((comment) => {
        const label = `${comment.filePath} ${comment.rangeLabel}`;
        return (
          <Tooltip key={comment.id}>
            <span className="inline-flex max-w-full items-center gap-1 rounded-control border border-border bg-card py-0.5 pl-2 pr-1 text-xs text-foreground">
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-auto min-w-0 flex-1 justify-start gap-1 p-0 font-normal hover:bg-transparent hover:text-foreground"
                  onClick={() => {
                    setDiffFile(comment.filePath);
                    review.openDiffsTab();
                  }}
                >
                  <IconMessage className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{label}</span>
                </Button>
              </TooltipTrigger>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="size-5 shrink-0 rounded-control hover:bg-muted"
                aria-label={`Remove comment on ${label}`}
                onClick={() => review.remove(comment.id)}
              >
                <IconX className="size-3" />
              </Button>
            </span>
            <TooltipContent side="top" className="max-w-96 whitespace-pre-wrap">
              {comment.text}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
