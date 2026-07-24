"use client";

import type { Id } from "@conductor/backend";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import { Spinner } from "@conductor/ui";
import { MentionContentPreview } from "./MentionContentPreview";

interface DocMentionHoverCardBodyProps {
  docId: Id<"docs">;
}

export function DocMentionHoverCardBody({
  docId,
}: DocMentionHoverCardBodyProps) {
  const doc = useQuery(api.docs.get, { id: docId });

  if (doc === undefined) {
    return (
      <MentionContentPreview title="Loading…">
        <Spinner className="size-4" />
      </MentionContentPreview>
    );
  }

  if (doc === null) {
    return (
      <MentionContentPreview title="Doc not found">
        <p>This document may have been deleted.</p>
      </MentionContentPreview>
    );
  }

  const preview =
    doc.content.trim() || doc.description?.trim() || "No content yet.";

  return (
    <MentionContentPreview title={doc.title}>
      <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-foreground">
        {preview}
      </pre>
    </MentionContentPreview>
  );
}
