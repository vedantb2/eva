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
    <div className="motion-base flex items-center gap-2 p-3 sm:gap-3 sm:px-4">
      {showBack && (
        <button
          onClick={onBack ?? (() => router.back())}
          className="motion-press flex-shrink-0 rounded-lg bg-muted/40 p-1.5 transition-all hover:-translate-y-0.5 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
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
