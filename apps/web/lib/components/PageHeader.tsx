"use client";

import { IconArrowLeft } from "@tabler/icons-react";
import { useRouter, usePathname } from "next/navigation";

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
  const router = useRouter();
  const pathname = usePathname();

  if (["/home", "/medications", "/readings"].includes(pathname) && !showBack)
    return null;

  return (
    <div className="flex items-center gap-2 border-b border-border/70 bg-card/60 px-3 py-2.5 backdrop-blur-sm sm:gap-3 sm:px-4 sm:py-3">
      {showBack && (
        <button
          onClick={onBack ?? (() => router.back())}
          className="flex-shrink-0 rounded-lg border border-border/70 bg-background/80 p-1.5 transition-colors hover:bg-accent"
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
