"use client";

import { IconArchive } from "@tabler/icons-react";

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
      {bannerMessage ? (
        <div className="flex w-full items-center gap-2 border-b border-border bg-muted px-3 py-2.5 sm:px-4">
          <IconArchive size={16} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{bannerMessage}</span>
        </div>
      ) : (
        <div className="flex w-full items-center justify-between gap-1 border-b border-border px-3 py-2 sm:gap-2">
          {headerLeft ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {headerLeft}
            </div>
          ) : (
            <div />
          )}
          {headerRight && (
            <div className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
              {headerRight}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
