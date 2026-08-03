"use client";

import { IconArchive } from "@tabler/icons-react";
import { PageHeader, PageHeaderActions } from "@eva/ui";

interface ChatPageWrapperProps {
  title: string;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
  /**
   * When set, replaces the header with a read-only banner (archived session,
   * or session whose PR is merged/closed).
   */
  readOnlyMessage?: string;
  /** Design sessions still pass this; prefer `readOnlyMessage` for custom copy. */
  isArchived?: boolean;
  children: React.ReactNode;
}

const ARCHIVED_MESSAGE = "This session is archived and read-only";

export function ChatPageWrapper({
  title: _title,
  headerLeft,
  headerRight,
  readOnlyMessage,
  isArchived,
  children,
}: ChatPageWrapperProps) {
  const bannerMessage =
    readOnlyMessage ?? (isArchived ? ARCHIVED_MESSAGE : undefined);

  return (
    <div className="flex h-full min-h-0 flex-col w-full">
      {/*
        Both branches are a `PageHeader`, so the bar keeps the same height when a
        session becomes archived — the banner used to be slightly taller than the
        header it replaced, which nudged the whole conversation down.
      */}
      {bannerMessage ? (
        <PageHeader className="bg-muted">
          {/* One child, or `PageHeader`'s justify-between would push the icon
              and the message to opposite ends of the bar. */}
          <div className="flex min-w-0 items-center gap-2">
            <IconArchive size={16} className="shrink-0 text-muted-foreground" />
            <span className="truncate text-2sm text-muted-foreground">
              {bannerMessage}
            </span>
          </div>
        </PageHeader>
      ) : (
        <PageHeader>
          {/*
            The left slot truncates rather than wrapping: a toolbar that grows a
            second row pushes the conversation around as controls appear.
          */}
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            {headerLeft}
          </div>
          {headerRight ? (
            <PageHeaderActions>{headerRight}</PageHeaderActions>
          ) : null}
        </PageHeader>
      )}
      {children}
    </div>
  );
}
