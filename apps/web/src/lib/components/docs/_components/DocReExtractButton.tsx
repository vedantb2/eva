"use client";

import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import { Button, Spinner } from "@conductor/ui";
import { IconRefresh } from "@tabler/icons-react";
import type { FunctionReturnType } from "convex/server";

type Doc = NonNullable<FunctionReturnType<typeof api.docs.get>>;

export function DocReExtractButton({ doc }: { doc: Doc }) {
  const startPrdParse = useMutation(api.docPrdWorkflow.startPrdParse);

  const isRunning = doc.activeWorkflowId !== undefined;
  const hasContent = (doc.content ?? "").trim().length > 0;

  const isStale =
    hasContent &&
    (doc.lastParsedAt === undefined ||
      (doc.contentUpdatedAt ?? doc.updatedAt) > doc.lastParsedAt);

  const handleClick = () => {
    if (isRunning) return;
    startPrdParse({ docId: doc._id });
  };

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={handleClick}
      disabled={isRunning || !hasContent}
      className="gap-1"
    >
      {isRunning ? <Spinner size="sm" /> : <IconRefresh size={14} />}
      Re-extract
      {isStale && !isRunning && (
        <span className="size-1.5 rounded-full bg-amber-500" />
      )}
    </Button>
  );
}
