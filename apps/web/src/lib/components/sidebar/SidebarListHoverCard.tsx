"use client";

import type { ReactNode } from "react";
import { compactRelativeTime } from "@conductor/shared/dates";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@conductor/ui";

/** Soft-limit so huge doc bodies aren't copied into every hover portal. */
const PREVIEW_SOFT_MAX = 280;

/** Collapse markdown/noise into a short plain-text hover preview. */
export function sidebarTextPreview(
  text: string | undefined | null,
): string | null {
  if (!text) return null;
  const cleaned = text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length === 0) return null;
  if (cleaned.length <= PREVIEW_SOFT_MAX) return cleaned;
  return `${cleaned.slice(0, PREVIEW_SOFT_MAX - 1)}…`;
}

interface SidebarListHoverCardProps {
  title: string;
  preview?: string | null;
  updatedAt: number;
  children: ReactNode;
}

/** Whole-row hover card: title, optional preview (3 lines), updated time. */
export function SidebarListHoverCard({
  title,
  preview,
  updatedAt,
  children,
}: SidebarListHoverCardProps) {
  return (
    <HoverCard openDelay={250} closeDelay={100}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        side="right"
        align="start"
        sideOffset={8}
        className="w-64 p-3"
      >
        <p className="text-sm font-medium text-foreground">{title}</p>
        {preview ? (
          <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">
            {preview}
          </p>
        ) : null}
        <p className="mt-3 text-xs text-muted-foreground">
          {compactRelativeTime(updatedAt)}
        </p>
      </HoverCardContent>
    </HoverCard>
  );
}
