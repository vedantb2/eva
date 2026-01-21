"use client";

import { IconArrowLeft } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

interface PageWrapperProps {
  title?: string;
  headerRight?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  children: React.ReactNode;
}

export function PageWrapper({
  title,
  headerRight,
  showBack = false,
  onBack,
  children,
}: PageWrapperProps) {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-4 py-4 flex items-center gap-3">
        {showBack && (
          <button
            onClick={onBack ?? (() => router.back())}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 flex-shrink-0"
          >
            <IconArrowLeft
              size={20}
              className="text-neutral-600 dark:text-neutral-400"
            />
          </button>
        )}
        {title && (
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 truncate">
            {title}
          </h1>
        )}
        {headerRight && (
          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
            {headerRight}
          </div>
        )}
      </div>
      <div className="flex-1 bg-neutral-50 dark:bg-neutral-900 overflow-auto">
        <div className="flex flex-col gap-4 md:gap-6 px-4 pt-2 pb-6 md:pb-8 min-h-full">
          {children}
        </div>
      </div>
    </div>
  );
}
