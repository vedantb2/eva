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
        <div className="motion-base relative border-b border-border/70 bg-card/65 px-3 py-3  sm:px-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              {showBack && (
                <Button
                  size="icon"
                  variant="outline"
                  onClick={onBack ?? (() => router.back())}
                  className="motion-press h-9 w-9 flex-shrink-0 rounded-full hover:scale-[1.03] active:scale-[0.97]"
                >
                  <IconArrowLeft size={16} className="text-muted-foreground" />
                </Button>
              )}
              {title && (
                <h1 className="truncate text-lg font-semibold tracking-[-0.02em] text-foreground sm:text-xl animate-in fade-in slide-in-from-left-1 duration-300">
                  {title}
                </h1>
              )}
            </div>
            {headerCenter ? (
              <div className="hidden min-w-0 justify-center md:flex animate-in fade-in duration-300">
                <div className="w-full max-w-xl">{headerCenter}</div>
              </div>
            ) : (
              <div className="hidden md:block" />
            )}
            <div className="flex items-center justify-end gap-2 justify-self-end animate-in fade-in slide-in-from-right-1 duration-300">
              {headerRight}
            </div>
          </div>
          {headerCenter && (
            <div className="mt-2 md:hidden animate-in fade-in duration-300">
              {headerCenter}
            </div>
          )}
        </div>
        <div
          className={`flex-1 min-h-0 ${fillHeight ? "overflow-hidden flex flex-col" : "overflow-auto scrollbar"}`}
        >
          <div
            className={`flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-1 duration-300 ${childPadding ? "px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-5" : ""} ${fillHeight ? "flex-1 min-h-0 overflow-hidden" : "min-h-full"}`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
