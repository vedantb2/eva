"use client";

import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import { Button, cn, PageHeader, PageHeaderActions, PageHeaderTitle } from "@eva/ui";
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
      <PageHeader>
        <PageHeaderTitle>Version History</PageHeaderTitle>
        <PageHeaderActions>
          <Button
            size="icon-sm"
            variant="ghost"
            className="hit-target"
            onClick={onClose}
          >
            <IconX size={14} />
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <div className="scrollbar scroll-fade flex-1 overflow-y-auto">
        {versions.length === 0 && (
          <p className="px-3 py-6 text-center text-2sm text-muted-foreground">
            {isRecap
              ? "No prior recap versions yet. Versions are saved when the recap updates on a new push."
              : "No versions saved yet. Versions are created automatically when you stop editing for a few minutes."}
          </p>
        )}
        {versions.map((ver) => (
          <Button
            key={ver._id}
            type="button"
            variant="ghost"
            onClick={() =>
              onSelectVersion(ver._id === selectedVersionId ? null : ver._id)
            }
            className={cn(
              "h-auto w-full flex-col items-stretch justify-start gap-0 whitespace-normal rounded-none border-b border-border px-3 py-2.5 text-left font-normal hover:bg-accent/50",
              ver._id === selectedVersionId && "bg-accent",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <MarqueeOnHover className="min-w-0 text-2sm font-medium">
                {ver.title}
              </MarqueeOnHover>
              {isRecap && ver.headSha ? (
                <span className="shrink-0 font-mono text-3xs text-muted-foreground">
                  {ver.headSha.slice(0, 7)}
                </span>
              ) : null}
            </div>
            <RelativeDateTime
              at={ver.createdAt}
              className="text-3xs text-muted-foreground"
            />
          </Button>
        ))}
      </div>
    </div>
  );
}
