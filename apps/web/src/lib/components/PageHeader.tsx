"use client";

import { IconArrowLeft } from "@tabler/icons-react";
import { useLocation } from "@tanstack/react-router";

interface PageHeaderProps {
  title?: string;
  headerRight?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
}

export function PageHeader({
  title,
  headerRight,
  showBack = false,
  onBack,
}: PageHeaderProps) {
  const { pathname } = useLocation();

  if (["/home", "/medications", "/readings"].includes(pathname) && !showBack)
    return null;

  return (
    <div className="motion-base flex items-center gap-2 p-3 sm:gap-3 sm:px-4">
      {showBack && (
        <button
          onClick={onBack ?? (() => window.history.back())}
          className="flex-shrink-0 rounded-lg border border-border bg-card p-1.5 transition-[background-color] hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
        >
          <IconArrowLeft size={18} className="text-muted-foreground" />
        </button>
      )}
      {title && (
        <h1 className="truncate text-base font-semibold tracking-[-0.02em] text-foreground sm:text-lg">
          {title}
        </h1>
      )}
      {headerRight && (
        <div className="ml-auto flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {headerRight}
        </div>
      )}
    </div>
  );
}
