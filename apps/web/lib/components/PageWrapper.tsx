"use client";

import { Button } from "@conductor/ui";
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
    <div className="flex-1 overflow-hidden bg-background">
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border/70 bg-card/60 p-4 backdrop-blur-sm">
          {showBack && (
            <Button
              size="icon"
              variant="outline"
              onClick={onBack ?? (() => router.back())}
              className="flex-shrink-0 rounded-full"
            >
              <IconArrowLeft size={16} className="text-muted-foreground" />
            </Button>
          )}
          {title && (
            <h1 className="truncate text-xl font-semibold tracking-[-0.02em] text-foreground">
              {title}
            </h1>
          )}
          {headerCenter && (
            <div className="flex-1 flex items-center justify-center gap-2">
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
          className={`flex-1 min-h-0 ${fillHeight ? "overflow-hidden flex flex-col" : "overflow-auto scrollbar"}`}
        >
          <div
            className={`flex flex-col gap-4 ${childPadding ? "px-4 py-4" : ""} ${fillHeight ? "flex-1 min-h-0 overflow-hidden" : "min-h-full"}`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
