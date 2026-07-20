"use client";

import { useNavigate } from "@tanstack/react-router";
import { DynamicLink } from "@/lib/components/DynamicLink";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Id } from "@conductor/backend";
import { SidebarSessionRow } from "@/lib/components/sidebar/SidebarSessionRow";
import {
  Button,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  SearchInput,
  Spinner,
  cn,
} from "@conductor/ui";
import {
  IconArchive,
  IconArchiveOff,
  IconChevronDown,
  IconClipboard,
  IconLink,
  IconPlus,
} from "@tabler/icons-react";
import { RelativeDateTime } from "@/lib/components/RelativeDateTime";
import { entityPathSegment, routeNumIdFromPath } from "@/lib/numId";
import {
  SharedLayoutNav,
  SharedLayoutNavSurface,
  sidebarNavListItemClass,
} from "@/lib/components/sidebar/SharedLayoutNav";
import { MarqueeOnHover } from "@/lib/components/ui/MarqueeOnHover";

type SessionStatus = "active" | "starting" | "stopping" | "closed";

interface SessionItem {
  _id: string;
  numId?: number;
  _creationTime: number;
  userId: Id<"users">;
  title: string;
  status: SessionStatus;
  updatedAt?: number;
  sandboxId?: string;
  prUrl?: string;
  prState?: "draft" | "open" | "merged" | "closed";
  firstMessagePreview?: string | null;
}

interface SessionListSidebarProps<T extends SessionItem> {
  sessions: T[] | undefined;
  archivedSessions: T[] | undefined;
  baseUrl: string;
  pathname: string;
  onNavigate?: () => void;
  createRequestId?: number;
  onCreate: (title: string) => Promise<string>;
  onArchive: (session: T) => Promise<void>;
  onUnarchive?: (session: T) => Promise<void>;
  onRename?: (session: T, newTitle: string) => Promise<void>;
  onDuplicate?: (session: T) => Promise<string>;
  emptyIcon: React.ReactNode;
  emptyLabel: string;
  createTitle: string;
  createPlaceholder: string;
  archiveTitle: string;
  archiveDescription?: string;
  searchPlaceholder: string;
  layoutId?: string;
}

export function SessionListSidebar<T extends SessionItem>({
  sessions,
  archivedSessions,
  baseUrl,
  pathname,
  onNavigate,
  createRequestId,
  onCreate,
  onArchive,
  onUnarchive,
  onRename,
  onDuplicate,
  emptyIcon,
  emptyLabel,
  createTitle,
  createPlaceholder,
  archiveTitle,
  archiveDescription,
  searchPlaceholder,
  layoutId = "session-list-nav",
}: SessionListSidebarProps<T>) {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [sessionToArchive, setSessionToArchive] = useState<{
    pathSegment: string;
    sessionId: string;
    title: string;
  } | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [sessionToRename, setSessionToRename] = useState<T | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const lastCreateRequestIdRef = useRef(createRequestId ?? 0);

  const currentSessionNumId = routeNumIdFromPath(pathname, baseUrl);

  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    const query = searchQuery.toLowerCase().trim();
    return query
      ? sessions.filter((session) =>
          session.title.toLowerCase().includes(query),
        )
      : sessions;
  }, [sessions, searchQuery]);

  const filteredArchivedSessions = useMemo(() => {
    if (!archivedSessions) return [];
    const query = searchQuery.toLowerCase().trim();
    return query
      ? archivedSessions.filter((session) =>
          session.title.toLowerCase().includes(query),
        )
      : archivedSessions;
  }, [archivedSessions, searchQuery]);

  useEffect(() => {
    if (createRequestId === undefined) return;
    if (createRequestId <= lastCreateRequestIdRef.current) return;
    lastCreateRequestIdRef.current = createRequestId;
    setIsCreateModalOpen(true);
  }, [createRequestId]);

  const handleArchive = async () => {
    if (!sessionToArchive) return;
    const sessionData = sessions?.find(
      (session) => session._id === sessionToArchive.sessionId,
    );
    if (!sessionData) return;
    setIsArchiving(true);
    try {
      await onArchive(sessionData);
      setSessionToArchive(null);

      if (currentSessionNumId === sessionToArchive.pathSegment) {
        navigate({ to: baseUrl });
        onNavigate?.();
      }
    } finally {
      setIsArchiving(false);
    }
  };

  const handleCreate = async () => {
    if (!newSessionTitle.trim()) return;
    setIsCreating(true);
    try {
      const id = await onCreate(newSessionTitle.trim());
      setNewSessionTitle("");
      setIsCreateModalOpen(false);
      navigate({ to: `${baseUrl}/${id}` });
      onNavigate?.();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-1.5 p-2">
        <SearchInput
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery("")}
          className="min-w-0 flex-1"
          inputClassName="border-sidebar-border/80 bg-sidebar/70 text-sidebar-foreground placeholder:text-muted-foreground"
        />
        <Button
          size="icon-sm"
          variant="ghost"
          className="shrink-0 text-sidebar-primary"
          onClick={() => setIsCreateModalOpen(true)}
          title={createTitle}
        >
          <IconPlus size={16} />
        </Button>
      </div>

      <div className="flex-1">
        {sessions === undefined ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="sm" />
          </div>
        ) : filteredSessions.length === 0 &&
          filteredArchivedSessions.length === 0 ? (
          <div className="p-4 text-center">
            <div className="mx-auto mb-2 flex justify-center text-muted-foreground">
              {emptyIcon}
            </div>
            <p className="text-sm text-muted-foreground">
              {sessions.length === 0 && (archivedSessions?.length ?? 0) === 0
                ? emptyLabel
                : "No matches found"}
            </p>
          </div>
        ) : (
          <SharedLayoutNav layoutId={layoutId} className="space-y-1">
            <AnimatePresence initial={false}>
              {filteredSessions.map((session) => {
                const pathSegment = entityPathSegment(session);
                const isSelected =
                  pathSegment !== null && currentSessionNumId === pathSegment;
                return (
                  <SidebarSessionRow
                    key={session._id}
                    session={session}
                    isSelected={isSelected}
                    baseUrl={baseUrl}
                    onNavigate={onNavigate}
                    onRename={onRename}
                    onDuplicate={onDuplicate}
                    onRenameRequest={(s) => {
                      setSessionToRename(s);
                      setRenameValue(s.title);
                    }}
                    onArchiveRequest={(s) => {
                      const segment = entityPathSegment(s);
                      if (!segment) return;
                      setSessionToArchive({
                        pathSegment: segment,
                        sessionId: s._id,
                        title: s.title,
                      });
                    }}
                    onDuplicateNavigate={(pathSegment) => {
                      navigate({ to: `${baseUrl}/${pathSegment}` });
                      onNavigate?.();
                    }}
                  />
                );
              })}
            </AnimatePresence>

            {filteredArchivedSessions.length > 0 && (
              <div className="mt-4 pt-4">
                <button
                  onClick={() => setIsArchiveOpen((prev) => !prev)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-sidebar-foreground"
                >
                  <IconChevronDown
                    size={14}
                    className={cn(
                      "transition-transform duration-200",
                      !isArchiveOpen && "-rotate-90",
                    )}
                  />
                  <IconArchive size={14} />
                  Archived ({filteredArchivedSessions.length})
                </button>
                <AnimatePresence initial={false}>
                  {isArchiveOpen &&
                    filteredArchivedSessions.map((session) => {
                      const pathSegment = entityPathSegment(session);
                      const isSelected =
                        pathSegment !== null &&
                        currentSessionNumId === pathSegment;
                      return (
                        <ContextMenu key={session._id}>
                          <ContextMenuTrigger asChild>
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.15 }}
                            >
                              <SharedLayoutNavSurface
                                itemId={`archived-${session._id}`}
                                isActive={isSelected}
                                className="group mx-1 rounded-menu-item"
                              >
                                <DynamicLink
                                  to={`${baseUrl}/${entityPathSegment(session) ?? session._id}`}
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
                                    at={
                                      session.updatedAt ?? session._creationTime
                                    }
                                    className={cn(
                                      "shrink-0 text-xs text-muted-foreground/60 transition-opacity",
                                      isSelected
                                        ? "opacity-100"
                                        : "opacity-0 group-hover:opacity-100",
                                    )}
                                  />
                                </DynamicLink>
                              </SharedLayoutNavSurface>
                            </motion.div>
                          </ContextMenuTrigger>
                          <ContextMenuContent
                            onClick={(e) => e.stopPropagation()}
                          >
                            {onUnarchive && (
                              <ContextMenuItem
                                onSelect={() => {
                                  void onUnarchive(session);
                                }}
                              >
                                <IconArchiveOff size={16} />
                                Unarchive
                              </ContextMenuItem>
                            )}
                            <ContextMenuItem
                              onSelect={() => {
                                void navigator.clipboard.writeText(
                                  session.title,
                                );
                              }}
                            >
                              <IconClipboard size={16} />
                              Copy title
                            </ContextMenuItem>
                            <ContextMenuItem
                              onSelect={() => {
                                void navigator.clipboard.writeText(
                                  window.location.origin +
                                    `${baseUrl}/${entityPathSegment(session) ?? session._id}`,
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
            )}
          </SharedLayoutNav>
        )}
      </div>

      <Dialog
        open={!!sessionToArchive}
        onOpenChange={(open) => {
          if (!open) setSessionToArchive(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{archiveTitle}</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to archive{" "}
            <strong>{sessionToArchive?.title}</strong>?
          </p>
          {archiveDescription && (
            <p className="mt-3 text-sm text-muted-foreground">
              {archiveDescription}
            </p>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSessionToArchive(null)}>
              Cancel
            </Button>
            <Button
              className="bg-warning text-warning-foreground"
              onClick={handleArchive}
              disabled={isArchiving}
            >
              {isArchiving ? <Spinner size="sm" /> : "Archive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCreateModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateModalOpen(false);
            setNewSessionTitle("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{createTitle}</DialogTitle>
          </DialogHeader>
          <Input
            placeholder={createPlaceholder}
            value={newSessionTitle}
            onChange={(event) => setNewSessionTitle(event.target.value)}
            autoFocus
            onKeyDown={(event) => {
              if (event.key === "Enter" && newSessionTitle.trim()) {
                void handleCreate();
              }
            }}
          />
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setIsCreateModalOpen(false);
                setNewSessionTitle("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isCreating || !newSessionTitle.trim()}
            >
              {isCreating ? <Spinner size="sm" /> : "Create Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!sessionToRename}
        onOpenChange={(open) => {
          if (!open) setSessionToRename(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              autoFocus
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  renameValue.trim() &&
                  sessionToRename
                ) {
                  setIsRenaming(true);
                  void onRename?.(sessionToRename, renameValue.trim())
                    .then(() => setSessionToRename(null))
                    .finally(() => setIsRenaming(false));
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSessionToRename(null)}>
              Cancel
            </Button>
            <Button
              disabled={isRenaming || !renameValue.trim()}
              onClick={() => {
                if (!sessionToRename) return;
                setIsRenaming(true);
                void onRename?.(sessionToRename, renameValue.trim())
                  .then(() => setSessionToRename(null))
                  .finally(() => setIsRenaming(false));
              }}
            >
              {isRenaming ? <Spinner size="sm" /> : "Rename"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
