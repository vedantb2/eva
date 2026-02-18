import { useState, useCallback } from "react";
import { Checkbox } from "@conductor/ui";
import {
  IconChevronDown,
  IconChevronRight,
  IconFilePlus,
  IconFileX,
  IconFileDiff,
  IconArrowsExchange,
} from "@tabler/icons-react";
import { PatchDiff } from "@pierre/diffs/react";
import type { AllDiffFileEntry } from "../../contexts/DiffTabContext";

interface AllDiffsViewProps {
  patches: AllDiffFileEntry[];
}

const STATUS_ICON: Record<AllDiffFileEntry["status"], typeof IconFileDiff> = {
  added: IconFilePlus,
  deleted: IconFileX,
  modified: IconFileDiff,
  renamed: IconArrowsExchange,
};

const STATUS_COLOR: Record<AllDiffFileEntry["status"], string> = {
  added: "text-green-400",
  deleted: "text-red-400",
  modified: "text-yellow-400",
  renamed: "text-blue-400",
};

export function AllDiffsView({ patches }: AllDiffsViewProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());

  const toggleCollapsed = useCallback((key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleReviewed = useCallback((key: string) => {
    setReviewed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const reviewedCount = reviewed.size;

  if (patches.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No changes to review
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-auto bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-2 flex items-center gap-3">
        <span className="text-xs text-muted-foreground">
          {patches.length} file{patches.length !== 1 ? "s" : ""} changed
        </span>
        <span className="text-xs text-muted-foreground">
          {reviewedCount}/{patches.length} reviewed
        </span>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {patches.map((entry) => {
          const key = `${entry.staged ? "staged" : "unstaged"}:${entry.path}`;
          const isCollapsed = collapsed.has(key);
          const isReviewed = reviewed.has(key);
          const StatusIcon = STATUS_ICON[entry.status];

          return (
            <div
              key={key}
              className={`border border-border rounded-lg overflow-hidden ${isReviewed ? "opacity-60" : ""}`}
            >
              <div
                className="flex items-center gap-2 px-3 py-2 bg-card cursor-pointer select-none"
                onClick={() => toggleCollapsed(key)}
              >
                {isCollapsed ? (
                  <IconChevronRight
                    size={14}
                    className="text-muted-foreground shrink-0"
                  />
                ) : (
                  <IconChevronDown
                    size={14}
                    className="text-muted-foreground shrink-0"
                  />
                )}
                <StatusIcon
                  size={14}
                  className={`shrink-0 ${STATUS_COLOR[entry.status]}`}
                />
                <span className="text-xs font-mono truncate flex-1">
                  {entry.path}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded ${
                    entry.staged
                      ? "bg-green-500/15 text-green-400"
                      : "bg-yellow-500/15 text-yellow-400"
                  }`}
                >
                  {entry.staged ? "Staged" : "Working Tree"}
                </span>
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5"
                >
                  <Checkbox
                    checked={isReviewed}
                    onCheckedChange={() => toggleReviewed(key)}
                    className="h-3.5 w-3.5"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    Reviewed
                  </span>
                </div>
              </div>
              {!isCollapsed && (
                <div className="border-t border-border">
                  <PatchDiff
                    patch={entry.patch}
                    options={{
                      themeType: "dark",
                      diffIndicators: "bars",
                      lineDiffType: "word",
                      expandUnchanged: true,
                      disableFileHeader: true,
                      overflow: "scroll",
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
