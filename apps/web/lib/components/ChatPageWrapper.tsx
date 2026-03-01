"use client";

import { IconArchive } from "@tabler/icons-react";

interface ChatPageWrapperProps {
  title: string;
  headerRight?: React.ReactNode;
  isArchived?: boolean;
  children: React.ReactNode;
}

export function ChatPageWrapper({
  title,
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
          <h2 className="text-sm font-medium truncate">{/* {title} */}</h2>
          {headerRight && (
            <div className="flex items-center gap-2">{headerRight}</div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
