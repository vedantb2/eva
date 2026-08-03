"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAction } from "convex/react";
import { api, type Id } from "@eva/backend";
import { Button, Spinner, Textarea } from "@eva/ui";
import { prErrorMessage } from "@/lib/prReviewQueries";

/**
 * GitHub's comment box at the foot of the conversation, so a reviewer can reply
 * without leaving eva. Sits outside the timeline's rail: it is not something that
 * happened to the pull request, it is the box for making something happen.
 *
 * `onPosted` refetches the overview — the comment lives on GitHub, so the
 * timeline only learns about it by asking again.
 */
export function PrCommentComposer({
  repoId,
  prNumber,
  onPosted,
}: {
  repoId: Id<"githubRepos">;
  prNumber: number;
  onPosted: () => void;
}) {
  const [body, setBody] = useState("");
  const addComment = useAction(api.github.addPrComment);

  const post = useMutation({
    mutationFn: (text: string) => addComment({ repoId, prNumber, body: text }),
    onSuccess: () => {
      setBody("");
      onPosted();
    },
  });

  const trimmed = body.trim();
  const submit = () => {
    if (trimmed.length > 0 && !post.isPending) post.mutate(trimmed);
  };

  return (
    // Aligned with the bubbles above (32px gutter + 12px gap), so the thread
    // still reads as one column.
    <div className="ml-11 overflow-hidden rounded-surface border border-border bg-card">
      <div className="border-b border-border bg-muted/40 px-3 py-2 text-xs font-medium text-foreground">
        Add a comment
      </div>

      <div className="space-y-3 p-3">
        <Textarea
          className="min-h-20 text-2sm"
          value={body}
          placeholder="Leave a comment"
          aria-label="Comment on this pull request"
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          }}
        />

        {post.isError ? (
          <p className="text-xs text-destructive">
            {prErrorMessage(post.error, "Couldn't post the comment")}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* eva authenticates as its GitHub App, so the comment carries the
              app's identity rather than the reader's account. */}
          <p className="text-xs text-muted-foreground">
            Posted to GitHub as the eva app.
          </p>
          <Button
            size="sm"
            onClick={submit}
            disabled={trimmed.length === 0 || post.isPending}
          >
            {post.isPending ? <Spinner size="sm" /> : null}
            Comment
          </Button>
        </div>
      </div>
    </div>
  );
}
