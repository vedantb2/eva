"use client";

import { IconArrowLeft } from "@tabler/icons-react";
import { useRouter, usePathname } from "next/navigation";

interface PageHeaderProps {
  title?: string;
  headerRight?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
}

export function PageHeader({ title, headerRight, showBack = false, onBack }: PageHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  if (["/home", "/medications", "/readings"].includes(pathname) && !showBack) return null;

  return (
    <div className="px-4 py-3 flex items-center gap-3">
      {showBack && (
        <button
          onClick={onBack ?? (() => router.back())}
          className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <IconArrowLeft size={18} className="text-neutral-600 dark:text-neutral-400" />
        </button>
      )}
      {title && <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{title}</h1>}
      {headerRight && <div className="ml-auto flex items-center gap-2">{headerRight}</div>}
    </div>
  );
}
