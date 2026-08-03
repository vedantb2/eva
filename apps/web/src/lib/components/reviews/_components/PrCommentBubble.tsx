"use client";

import type { ReactNode } from "react";
import { IconExternalLink } from "@tabler/icons-react";
import { Streamdown } from "streamdown";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import { MARKDOWN_CLASS } from "./prOverviewMeta";

interface PrCommentBubbleProps {
  authorLogin: string | null;
  /** What the author did, e.g. "commented" — GitHub's own phrasing. */
  action: string;
  at: string | null;
  htmlUrl: string;
  body: string;
  /** File an inline comment is anchored to. */
  path?: string;
  line?: number | null;
  /** Shown in place of the body when there is nothing to render. */
  emptyLabel?: string;
  /** Controls for this bubble, e.g. Edit on the description. */
  actions?: ReactNode;
}

/**
 * One speech bubble on the conversation: a header strip naming the author and
 * what they did, then their markdown. Used for the pull request description,
 * standalone comments, and review summaries alike, so every piece of authored
 * text on the tab reads the same way.
 *
 * The avatar is not here — the timeline owns the gutter so bubbles line up on a
 * single rail whatever kind of event they belong to.
 */
export function PrCommentBubble({
  authorLogin,
  action,
  at,
  htmlUrl,
  body,
  path,
  line,
  emptyLabel,
  actions,
}: PrCommentBubbleProps) {
  const hasBody = body.trim().length > 0;

  return (
    <div className="overflow-hidden rounded-md border border-border bg-card">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">
          {authorLogin ?? "unknown"}
        </span>
        <span>{action}</span>
        {path ? (
          <span className="min-w-0 truncate rounded border border-border bg-card px-1 py-0.5 font-mono">
            {path}
            {line === undefined || line === null ? "" : `:${line}`}
          </span>
        ) : null}
        <span className="ml-auto flex shrink-0 items-center gap-2">
          {actions}
          {at ? <RelativeDateTime at={new Date(at).getTime()} /> : null}
          <a
            href={htmlUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
            aria-label="View on GitHub"
          >
            <IconExternalLink size={12} aria-hidden />
          </a>
        </span>
      </div>

      <div className="px-3 py-2.5">
        {hasBody ? (
          <Streamdown className={MARKDOWN_CLASS}>{body}</Streamdown>
        ) : (
          <p className="text-sm italic text-muted-foreground">
            {emptyLabel ?? "No description provided."}
          </p>
        )}
      </div>
    </div>
  );
}
