"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { Button, cn } from "@conductor/ui";
import { IconX } from "@tabler/icons-react";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";

export function DocHistoryPanel({
  docId,
  selectedVersionId,
  onSelectVersion,
  onClose,
}: {
  docId: Id<"docs">;
  selectedVersionId: Id<"docVersions"> | null;
  onSelectVersion: (id: Id<"docVersions"> | null) => void;
  onClose: () => void;
}) {
  const versions = useQuery(api.docVersions.list, { docId }) ?? [];

  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-l border-border">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <span className="text-sm font-medium">Version History</span>
        <Button
          size="icon"
          variant="ghost"
          className="size-6"
          onClick={onClose}
        >
          <IconX size={14} />
        </Button>
      </div>

      <div className="scrollbar flex-1 overflow-y-auto">
        {versions.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            No versions saved yet. Versions are created automatically when you
            stop editing for a few minutes.
          </p>
        )}
        {versions.map((ver) => (
          <button
            key={ver._id}
            type="button"
            onClick={() =>
              onSelectVersion(ver._id === selectedVersionId ? null : ver._id)
            }
            className={cn(
              "w-full border-b border-border px-3 py-2.5 text-left transition-colors hover:bg-accent/50",
              ver._id === selectedVersionId && "bg-accent",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium truncate">{ver.title}</span>
            </div>
            <RelativeDateTime
              at={ver.createdAt}
              className="text-[10px] text-muted-foreground"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
