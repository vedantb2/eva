"use client";

import { useEffect } from "react";
import { Button } from "@conductor/ui";
import { IconArrowLeft } from "@tabler/icons-react";
import { usePageTitle } from "@/lib/contexts/PageTitleContext";

interface PageWrapperProps {
  title?: React.ReactNode;
  headerCenter?: React.ReactNode;
  headerRight?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  fillHeight?: boolean;
  children: React.ReactNode;
  childPadding?: boolean;
  comfortable?: boolean;
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
  comfortable = false,
}: PageWrapperProps) {
  const { setPageTitle } = usePageTitle();
  const isStringTitle = typeof title === "string";

  useEffect(() => {
    setPageTitle(isStringTitle ? title : "");
    return () => setPageTitle("");
  }, [title, isStringTitle, setPageTitle]);

  return (
    <div className="flex-1 h-full min-h-0 overflow-hidden animate-in fade-in duration-300">
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <div
          className={`motion-base relative ${comfortable ? "p-4 sm:px-6" : "p-3 sm:px-4"}`}
        >
          <div
            className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] ${comfortable ? "mx-auto w-full max-w-5xl" : ""}`}
          >
            <div
              className={`flex min-w-0 items-center gap-2 sm:gap-3 ${!headerCenter ? "md:col-span-2" : ""}`}
            >
              {showBack && (
                <Button
                  size="icon"
                  variant="outline"
                  onClick={onBack ?? (() => window.history.back())}
                  className="motion-press h-9 w-9 flex-shrink-0 rounded-full hover:scale-[1.03] active:scale-[0.96]"
                >
                  <IconArrowLeft size={16} className="text-muted-foreground" />
                </Button>
              )}
              {title && (
                <h1
                  className={`min-w-0 whitespace-nowrap text-base font-semibold tracking-[-0.02em] text-foreground sm:text-lg md:text-xl animate-in fade-in slide-in-from-left-1 duration-300 text-balance ${isStringTitle ? "hidden lg:block" : ""}`}
                >
                  {title}
                </h1>
              )}
            </div>
            {headerCenter && (
              <div className="hidden min-w-0 justify-center md:flex animate-in fade-in duration-300">
                <div className="w-full max-w-xl">{headerCenter}</div>
              </div>
            )}
            <div className="flex min-h-10 items-center justify-end gap-1.5 sm:gap-2 justify-self-end animate-in fade-in slide-in-from-right-1 duration-300">
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
            className={`flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-1 duration-300 ${childPadding ? (comfortable ? "p-4 pt-0 sm:px-6" : "p-3 pt-0") : ""} ${fillHeight ? "flex-1 min-h-0 overflow-hidden" : "min-h-full"}`}
          >
            {comfortable ? (
              <div className="mx-auto w-full max-w-5xl">{children}</div>
            ) : (
              children
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
