"use client";

import { useEffect } from "react";
import { Button } from "@eva/ui";
import { IconArrowLeft } from "@tabler/icons-react";
import { usePageTitle } from "@/lib/contexts/PageTitleContext";

interface PageWrapperProps {
  title?: React.ReactNode;
  headerCenter?: React.ReactNode;
  headerRight?: React.ReactNode;
  /**
   * Secondary refine row under the title (filters, search, segmented controls).
   * Kept out of `headerRight` so the title row stays quiet.
   */
  toolbar?: React.ReactNode;
  /** Route / view tabs under the title (and under toolbar when both exist). */
  tabs?: React.ReactNode;
  /**
   * Indent the title row by the card gutter (`px-4`) so the page title lines up
   * with the section titles inside the cards below, rather than with the card
   * edge. For settings-shaped pages; leave off for list pages whose card has no
   * section heading to align to.
   */
  insetHeader?: boolean;
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
  toolbar,
  tabs,
  insetHeader = false,
  showBack = false,
  onBack,
  fillHeight = false,
  children,
  childPadding = true,
  comfortable = false,
}: PageWrapperProps) {
  const { setPageTitle } = usePageTitle();
  const isStringTitle = typeof title === "string";
  const hasHeaderRight = headerRight != null;
  const hasToolbar = toolbar != null;
  const hasTabs = tabs != null;

  useEffect(() => {
    setPageTitle(isStringTitle ? title : "");
    return () => setPageTitle("");
  }, [title, isStringTitle, setPageTitle]);

  return (
    <div className="flex-1 h-full min-h-0 overflow-hidden animate-in fade-in duration-300">
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <div
          className={`motion-base relative ${comfortable ? "px-4 py-6 sm:px-6" : "p-3 sm:px-4"}`}
        >
          <div
            className={`grid items-center gap-2 sm:gap-3 ${hasHeaderRight ? "grid-cols-[minmax(0,1fr)_minmax(0,auto)] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]" : "grid-cols-1"} ${comfortable ? "mx-auto w-full max-w-5xl" : ""} ${insetHeader ? "px-4" : ""}`}
          >
            <div
              className={`flex min-w-0 items-center gap-2 sm:gap-3 ${hasHeaderRight && !headerCenter ? "md:col-span-2" : ""}`}
            >
              {showBack && (
                <Button
                  size="icon"
                  variant="outline"
                  onClick={onBack ?? (() => window.history.back())}
                  aria-label="Go back"
                  className="motion-press max-sm:hit-target h-9 w-9 shrink-0 rounded-full hover:scale-[1.03] active:scale-[0.96]"
                >
                  <IconArrowLeft size={16} className="text-muted-foreground" />
                </Button>
              )}
              {title && (
                <h1
                  className={`min-w-0 flex-1 text-base font-semibold tracking-[-0.02em] text-foreground sm:text-lg md:text-xl animate-in fade-in slide-in-from-left-1 duration-300 ${isStringTitle ? "hidden whitespace-nowrap text-balance lg:block" : "overflow-hidden"}`}
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
            {hasHeaderRight ? (
              <div className="flex min-h-10 max-sm:min-w-0 max-sm:flex-wrap items-center justify-end gap-1.5 sm:gap-2 justify-self-end animate-in fade-in slide-in-from-right-1 duration-300">
                {headerRight}
              </div>
            ) : null}
          </div>
          {headerCenter && (
            <div className="mt-2 md:hidden animate-in fade-in duration-300">
              {headerCenter}
            </div>
          )}
          {hasToolbar || hasTabs ? (
            <div
              className={`mt-3 space-y-3 ${comfortable ? "mx-auto w-full max-w-5xl" : ""}`}
            >
              {hasToolbar ? (
                <div className="flex min-h-9 flex-wrap items-center gap-1.5 sm:gap-2">
                  {toolbar}
                </div>
              ) : null}
              {hasTabs ? (
                <div className="min-w-0 max-sm:max-w-full max-sm:overflow-x-auto scrollbar">
                  {tabs}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        <div
          className={`flex-1 min-h-0 ${fillHeight ? "overflow-hidden flex flex-col" : "overflow-auto scrollbar"}`}
        >
          <div
            className={`flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-1 duration-300 ${childPadding ? (comfortable ? "p-4 pt-0 sm:px-6" : "p-3 pt-0 sm:px-4") : ""} ${fillHeight ? "flex-1 min-h-0 overflow-hidden" : "min-h-full"}`}
          >
            {comfortable ? (
              <div
                className={`mx-auto w-full max-w-5xl ${fillHeight ? "flex min-h-0 flex-1 flex-col" : ""}`}
              >
                {children}
              </div>
            ) : (
              children
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
