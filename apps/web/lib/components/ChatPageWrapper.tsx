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
    <div className="flex h-full min-h-0 flex-col">
      {isArchived ? (
        <div className="flex items-center gap-2 px-4 py-5 border-b border-border bg-muted/50 animate-in fade-in duration-300">
          <IconArchive size={16} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            This session is archived and read-only
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 animate-in fade-in duration-300">
          {headerLeft ? (
            <div className="flex items-center gap-2">{headerLeft}</div>
          ) : (
            <div />
          )}
          {headerRight && (
            <div className="flex items-center gap-2">{headerRight}</div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
