"use client";

import type { ReactNode } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { UserInitials } from "@conductor/shared";
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

function authorDisplayName(user: {
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  email?: string | null;
}): string {
  const fromParts = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  if (fromParts) return fromParts;
  if (user.fullName?.trim()) return user.fullName.trim();
  if (user.email?.trim()) return user.email.trim();
  return "Unknown";
}

function HoverCardAuthor({ userId }: { userId: Id<"users"> }) {
  const user = useQuery(api.users.get, { id: userId });
  if (!user) {
    return (
      <UserInitials userId={userId} size="sm" hideLastSeen disableProfileCard />
    );
  }
  return (
    <div className="flex min-w-0 items-center gap-2">
      <UserInitials
        userId={userId}
        user={user}
        size="sm"
        hideLastSeen
        disableProfileCard
      />
      <span className="truncate text-xs text-muted-foreground">
        {authorDisplayName(user)}
      </span>
    </div>
  );
}

interface SidebarListHoverCardProps {
  title: string;
  preview?: string | null;
  updatedAt: number;
  /** Author when known (new docs / automations). Omitted for legacy docs. */
  userId?: Id<"users">;
  children: ReactNode;
}

/** Whole-row hover card: title, optional preview (3 lines), author + updated time. */
export function SidebarListHoverCard({
  title,
  preview,
  updatedAt,
  userId,
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
        <div className="mt-3 flex items-center justify-between gap-2">
          {userId ? <HoverCardAuthor userId={userId} /> : <span />}
          <span className="shrink-0 text-xs text-muted-foreground">
            {compactRelativeTime(updatedAt)}
          </span>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
