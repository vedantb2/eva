"use client";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Checkbox,
} from "@eva/ui";
import type { ThemeTypes } from "@pierre/diffs";
import { ReviewableFileDiff } from "./ReviewableFileDiff";

interface DiffFileAccordionItemProps {
  path: string;
  patch: string;
  diffView: "unified" | "split";
  resolvedTheme: ThemeTypes;
  viewed: boolean;
  onViewedChange: (viewed: boolean) => void;
}

/**
 * One collapsible file in the Diffs list. Header mirrors GitHub's file bar:
 * path + chevron toggle the accordion; Viewed checkbox marks progress and is
 * wired by the parent to also collapse/expand (GitHub behavior).
 */
export function DiffFileAccordionItem({
  path,
  patch,
  diffView,
  resolvedTheme,
  viewed,
  onViewedChange,
}: DiffFileAccordionItemProps) {
  const fileName = path.includes("/")
    ? path.slice(path.lastIndexOf("/") + 1)
    : path;
  const dirPath = path.includes("/")
    ? path.slice(0, path.lastIndexOf("/"))
    : null;

  // AccordionItem defaults to `last:border-b-0`; keep `last:border-b` so the
  // final card still has a full hairline outline.
  return (
    <AccordionItem
      value={path}
      className="overflow-hidden rounded-md border border-border bg-card shadow-sm last:border-b"
    >
      <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-2">
        <AccordionTrigger className="min-w-0 flex-1 py-2 hover:no-underline">
          <span className="mr-2 flex min-w-0 flex-1 items-baseline gap-1.5 text-left font-mono text-xs">
            {dirPath ? (
              <span className="truncate text-muted-foreground" title={path}>
                {dirPath}/
              </span>
            ) : null}
            <span className="shrink-0 font-medium text-foreground">
              {fileName}
            </span>
          </span>
        </AccordionTrigger>
        <label
          className="flex shrink-0 cursor-pointer items-center gap-1.5 py-2 pr-1 text-xs text-muted-foreground hover:text-foreground"
          // Keep the checkbox out of the accordion trigger so checking Viewed
          // does not fight the expand/collapse control.
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <Checkbox
            checked={viewed}
            onCheckedChange={(checked) => onViewedChange(checked === true)}
            aria-label={`Mark ${path} as viewed`}
          />
          <span>Viewed</span>
        </label>
      </div>
      <AccordionContent className="pb-0">
        <ReviewableFileDiff
          patch={patch}
          path={path}
          diffView={diffView}
          resolvedTheme={resolvedTheme}
          hideFileHeader
        />
      </AccordionContent>
    </AccordionItem>
  );
}
