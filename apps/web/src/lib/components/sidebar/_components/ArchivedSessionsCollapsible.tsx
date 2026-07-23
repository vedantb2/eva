"use client";

import { useState } from "react";
import { DynamicLink } from "@/lib/components/DynamicLink";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import {
  SharedLayoutNavSurface,
  sidebarNavListItemClass,
} from "@/lib/components/sidebar/SharedLayoutNav";
import { MarqueeOnHover } from "@/lib/components/ui/MarqueeOnHover";
import { entityPathSegment } from "@/lib/numId";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  cn,
} from "@conductor/ui";
import {
  IconArchive,
  IconArchiveOff,
  IconChevronDown,
  IconClipboard,
  IconLink,
} from "@tabler/icons-react";
import { AnimatePresence, m } from "motion/react";

interface ArchivedSessionItem {
  _id: string;
  numId?: number;
  _creationTime: number;
  title: string;
  updatedAt?: number;
}

interface ArchivedSessionsCollapsibleProps<T extends ArchivedSessionItem> {
  sessions: T[];
  baseUrl: string;
  pathname: string;
  onNavigate?: () => void;
  onUnarchive?: (session: T) => Promise<void>;
  /** Prefix for SharedLayoutNavSurface itemId so it stays unique across groups. */
  itemIdPrefix?: string;
}

/**
 * Nested "Archived" disclosure under an app/session list. Starts collapsed;
 * only render the parent when `sessions.length > 0`.
 */
export function ArchivedSessionsCollapsible<T extends ArchivedSessionItem>({
  sessions,
  baseUrl,
  pathname,
  onNavigate,
  onUnarchive,
  itemIdPrefix = "archived",
}: ArchivedSessionsCollapsibleProps<T>) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-2 pt-2">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-sidebar-foreground"
      >
        <IconChevronDown
          size={14}
          className={cn(
            "transition-transform duration-200",
            !isOpen && "-rotate-90",
          )}
        />
        <IconArchive size={14} />
        Archived ({sessions.length})
      </button>
      <AnimatePresence initial={false}>
        {isOpen &&
          sessions.map((session) => {
            const pathSegment = entityPathSegment(session);
            const href = `${baseUrl}/${pathSegment ?? session._id}`;
            const isSelected =
              pathname === href || pathname.startsWith(`${href}/`);
            return (
              <ContextMenu key={session._id}>
                <ContextMenuTrigger asChild>
                  <m.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <SharedLayoutNavSurface
                      itemId={`${itemIdPrefix}-${session._id}`}
                      isActive={isSelected}
                      className="group mx-1 rounded-menu-item"
                    >
                      <DynamicLink
                        to={href}
                        onClick={onNavigate}
                        className={cn(
                          sidebarNavListItemClass(isSelected),
                          "justify-between gap-2",
                          !isSelected && "text-sidebar-foreground/60",
                        )}
                      >
                        <MarqueeOnHover className="min-w-0 text-sm">
                          {session.title}
                        </MarqueeOnHover>
                        <RelativeDateTime
                          at={session.updatedAt ?? session._creationTime}
                          className={cn(
                            "shrink-0 text-xs text-muted-foreground/60 transition-opacity",
                            isSelected
                              ? "opacity-100"
                              : "opacity-0 group-hover:opacity-100",
                          )}
                        />
                      </DynamicLink>
                    </SharedLayoutNavSurface>
                  </m.div>
                </ContextMenuTrigger>
                <ContextMenuContent onClick={(e) => e.stopPropagation()}>
                  {onUnarchive ? (
                    <ContextMenuItem
                      onSelect={() => {
                        void onUnarchive(session);
                      }}
                    >
                      <IconArchiveOff size={16} />
                      Unarchive
                    </ContextMenuItem>
                  ) : null}
                  <ContextMenuItem
                    onSelect={() => {
                      void navigator.clipboard.writeText(session.title);
                    }}
                  >
                    <IconClipboard size={16} />
                    Copy title
                  </ContextMenuItem>
                  <ContextMenuItem
                    onSelect={() => {
                      void navigator.clipboard.writeText(
                        window.location.origin + href,
                      );
                    }}
                  >
                    <IconLink size={16} />
                    Copy link
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
      </AnimatePresence>
    </div>
  );
}
