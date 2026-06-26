"use client";

import { IconArrowLeft } from "@tabler/icons-react";
import { useLocation } from "@tanstack/react-router";
import { Button } from "@conductor/ui";

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
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={onBack ?? (() => window.history.back())}
          className="flex-shrink-0 rounded-surface"
        >
          <IconArrowLeft size={18} className="text-muted-foreground" />
        </Button>
      )}
      {title && (
        <h1 className="min-w-0 flex-1 truncate text-balance text-base font-semibold tracking-[-0.02em] text-foreground sm:text-lg">
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
