"use client";

import { Button } from "@heroui/react";
import { IconArrowLeft } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

interface PageWrapperProps {
  title?: string;
  headerCenter?: React.ReactNode;
  headerRight?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  fillHeight?: boolean;
  children: React.ReactNode;
  childPadding?: boolean;
}

export function PageWrapper({
  title,
  headerCenter,
  headerRight,
  showBack = false,
  onBack,
  fillHeight = false,
  children,
  childPadding = true,
}: PageWrapperProps) {
  const router = useRouter();

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-neutral-900">
      <div className="relative p-4 pb-[18px] flex items-center gap-3">
        {showBack && (
          <Button
            size="sm"
            isIconOnly
            radius="full"
            variant="flat"
            onPress={onBack ?? (() => router.back())}
            className="flex-shrink-0"
          >
            <IconArrowLeft
              size={16}
              className="text-neutral-600 dark:text-neutral-400"
            />
          </Button>
        )}
        {title && (
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100 truncate">
            {title}
          </h1>
        )}
        {headerCenter && (
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
            {headerCenter}
          </div>
        )}
        {headerRight && (
          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
            {headerRight}
          </div>
        )}
      </div>
      <div
        className={`flex-1 min-h-0 bg-white dark:bg-neutral-900 ${fillHeight ? "overflow-hidden flex flex-col" : "overflow-auto scrollbar"}`}
      >
        <div
          className={`flex flex-col gap-4 ${childPadding ? "px-4 py-2" : ""}  ${fillHeight ? "flex-1 min-h-0 overflow-hidden" : "min-h-full"}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
