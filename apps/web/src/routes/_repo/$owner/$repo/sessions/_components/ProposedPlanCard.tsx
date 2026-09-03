"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  cn,
  MessageResponse,
} from "@eva/ui";
import { IconCheck, IconCode, IconCopy, IconDownload } from "@tabler/icons-react";
import {
  buildCollapsedProposedPlanPreviewMarkdown,
  buildProposedPlanMarkdownFilename,
  downloadPlanAsMarkdownFile,
  normalizePlanMarkdownForExport,
  proposedPlanTitle,
  stripDisplayedPlanMarkdown,
} from "./planExport";

export function ProposedPlanCard({
  planMarkdown,
  implemented,
  onImplement,
  onImplementInNewSession,
  isArchived,
}: {
  planMarkdown: string;
  implemented: boolean;
  onImplement?: () => void;
  onImplementInNewSession?: () => void;
  isArchived?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const title = proposedPlanTitle(planMarkdown) ?? "Proposed plan";
  const lineCount = planMarkdown.split("\n").length;
  const canCollapse = planMarkdown.length > 900 || lineCount > 20;
  const displayed = stripDisplayedPlanMarkdown(planMarkdown);
  const collapsedPreview = canCollapse
    ? buildCollapsedProposedPlanPreviewMarkdown(planMarkdown, { maxLines: 10 })
    : null;
  const exportContents = normalizePlanMarkdownForExport(planMarkdown);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(exportContents);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    downloadPlanAsMarkdownFile(
      buildProposedPlanMarkdownFilename(planMarkdown),
      exportContents,
    );
  };

  return (
    <div className="rounded-surface border border-border bg-card/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Badge
            variant="secondary"
            className="shrink-0 rounded-md px-1.5 py-0 text-[10px] font-semibold tracking-wide uppercase"
          >
            {implemented ? "Implemented" : "Plan"}
          </Badge>
          <p className="truncate text-sm font-medium">{title}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="size-8"
            onClick={() => void handleCopy()}
            aria-label={copied ? "Copied" : "Copy plan"}
          >
            {copied ? (
              <IconCheck className="size-4 text-success" />
            ) : (
              <IconCopy className="size-4" />
            )}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-8"
            onClick={handleDownload}
            aria-label="Download plan as markdown"
          >
            <IconDownload className="size-4" />
          </Button>
        </div>
      </div>
      <div className="mt-4">
        <div className={cn("relative", canCollapse && !expanded && "max-h-64 overflow-hidden")}>
          <div className={cn(canCollapse && !expanded && "max-h-64 overflow-hidden")}>
            <MessageResponse className="prose prose-sm dark:prose-invert max-w-none">
              {canCollapse && !expanded ? (collapsedPreview ?? "") : displayed}
            </MessageResponse>
          </div>
          {canCollapse && !expanded ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-card via-card/80 to-transparent" />
          ) : null}
        </div>
        {canCollapse ? (
          <div className="mt-3 flex justify-center">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? "Collapse plan" : "Expand plan"}
            </Button>
          </div>
        ) : null}
      </div>
      {!implemented && !isArchived && (onImplement || onImplementInNewSession) ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {onImplement ? (
            <Button
              size="sm"
              className="bg-success text-success-foreground hover:bg-success/90"
              onClick={onImplement}
            >
              <IconCode className="size-3.5" />
              Implement
            </Button>
          ) : null}
          {onImplementInNewSession ? (
            <Button size="sm" variant="secondary" onClick={onImplementInNewSession}>
              Implement in new session
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
