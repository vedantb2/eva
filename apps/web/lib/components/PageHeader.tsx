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
    <div className="px-2 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-3">
      {showBack && (
        <button
          onClick={onBack ?? (() => router.back())}
          className="p-1.5 rounded-lg hover:bg-muted flex-shrink-0"
        >
          <IconArrowLeft size={18} className="text-muted-foreground" />
        </button>
      )}
      {title && (
        <h1 className="text-base sm:text-lg font-semibold text-foreground truncate">
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
