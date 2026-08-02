"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import { Button, cn } from "@eva/ui";
import { IconX } from "@tabler/icons-react";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import { MarqueeOnHover } from "@/lib/components/ui/MarqueeOnHover";

export function DocHistoryPanel({
  docId,
  docKind,
  selectedVersionId,
  onSelectVersion,
  onClose,
}: {
  docId: Id<"docs">;
  docKind?: "document" | "pr-recap";
  selectedVersionId: Id<"docVersions"> | null;
  onSelectVersion: (id: Id<"docVersions"> | null) => void;
  onClose: () => void;
}) {
  const versions = useQuery(api.docVersions.list, { docId }) ?? [];
  const isRecap = docKind === "pr-recap";

  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-l border-border">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <span className="text-sm font-medium">Version History</span>
        <Button
          size="icon-sm"
          variant="ghost"
          className="hit-target"
          onClick={onClose}
        >
          <IconX size={14} />
        </Button>
      </div>

      <div className="scrollbar flex-1 overflow-y-auto">
        {versions.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            {isRecap
              ? "No prior recap versions yet. Versions are saved when the recap updates on a new push."
              : "No versions saved yet. Versions are created automatically when you stop editing for a few minutes."}
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
              "group w-full border-b border-border px-3 py-2.5 text-left transition-colors hover:bg-accent/50",
              ver._id === selectedVersionId && "bg-accent",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <MarqueeOnHover className="min-w-0 text-sm font-medium">
                {ver.title}
              </MarqueeOnHover>
              {isRecap && ver.headSha ? (
                <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                  {ver.headSha.slice(0, 7)}
                </span>
              ) : null}
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
