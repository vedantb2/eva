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
    <div
      className={`${fillHeight ? "h-full min-h-0" : ""} flex-1 overflow-hidden animate-in fade-in duration-300`}
    >
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="motion-base relative flex items-center gap-3 border-b border-border/70 bg-card/60 p-4 backdrop-blur-sm">
          {showBack && (
            <Button
              size="icon"
              variant="outline"
              onClick={onBack ?? (() => router.back())}
              className="motion-press flex-shrink-0 rounded-full hover:scale-[1.03] active:scale-[0.97]"
            >
              <IconArrowLeft size={16} className="text-muted-foreground" />
            </Button>
          )}
          {title && (
            <h1 className="truncate text-xl font-semibold tracking-[-0.02em] text-foreground animate-in fade-in slide-in-from-left-1 duration-300">
              {title}
            </h1>
          )}
          {headerCenter && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-in fade-in duration-300">
              <div className="pointer-events-auto">{headerCenter}</div>
            </div>
          )}
          {headerRight && (
            <div className="ml-auto flex items-center gap-2 flex-shrink-0 animate-in fade-in slide-in-from-right-1 duration-300">
              {headerRight}
            </div>
          )}
        </div>
        <div
          className={`flex-1 min-h-0 ${fillHeight ? "overflow-hidden flex flex-col" : "overflow-auto scrollbar"}`}
        >
          <div
            className={`flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-1 duration-300 ${childPadding ? "px-4 py-4" : ""} ${fillHeight ? "flex-1 min-h-0 overflow-hidden" : "min-h-full"}`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
