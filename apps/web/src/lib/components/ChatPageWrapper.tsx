"use client";

import { IconArchive } from "@tabler/icons-react";

interface ChatPageWrapperProps {
  title: string;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
  isArchived?: boolean;
  children: React.ReactNode;
}

export function ChatPageWrapper({
  title,
  headerLeft,
  headerRight,
  isArchived,
  children,
}: ChatPageWrapperProps) {
  return (
    <div className="flex h-full min-h-0 flex-col w-full">
      {isArchived ? (
        <div className="w-full flex items-center gap-2 px-3 py-3 bg-muted/50 animate-in fade-in duration-300 sm:px-4 sm:py-5">
          <IconArchive size={16} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            This session is archived and read-only
          </span>
        </div>
      ) : (
        <div className="w-full flex items-center justify-between gap-1 p-2 animate-in fade-in duration-300 sm:gap-2 sm:p-3">
          {headerLeft ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {headerLeft}
            </div>
          ) : (
            <div />
          )}
          {headerRight && (
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end">
              {headerRight}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
