"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "@conductor/backend";
import { api } from "@conductor/backend";
import { SidebarSessionItem } from "@/lib/components/sidebar/SidebarSessionItem";
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
import { IconArchive, IconChevronDown, IconPalette } from "@tabler/icons-react";
import dayjs from "@conductor/shared/dates";

interface DesignSessionsSidebarProps {
  repoId: Id<"githubRepos">;
  basePath: string;
  pathname: string;
  onNavigate?: () => void;
  createRequestId?: number;
}

export function DesignSessionsSidebar({
  repoId,
  basePath,
  pathname,
  onNavigate,
  createRequestId,
}: DesignSessionsSidebarProps) {
  const router = useRouter();
  const sessions = useQuery(api.designSessions.list, { repoId });
  const archivedSessions = useQuery(api.designSessions.listArchived, {
    repoId,
  });
  const createSession = useMutation(api.designSessions.create);
  const archiveSession = useMutation(api.designSessions.archive);

  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [sessionToArchive, setSessionToArchive] = useState<{
    id: Id<"designSessions">;
    title: string;
  } | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const lastCreateRequestIdRef = useRef(createRequestId ?? 0);

  const baseUrl = `${basePath}/designs`;
  const currentSessionId = pathname.startsWith(`${baseUrl}/`)
    ? pathname.slice(baseUrl.length + 1).split("/")[0]
    : null;

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
    setIsArchiving(true);
    try {
      await archiveSession({ id: sessionToArchive.id });
      setSessionToArchive(null);
      if (currentSessionId === sessionToArchive.id) {
        router.push(baseUrl);
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
      const id = await createSession({
        repoId,
        title: newSessionTitle.trim(),
      });
      setNewSessionTitle("");
      setIsCreateModalOpen(false);
      router.push(`${baseUrl}/${id}`);
      onNavigate?.();
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <div className="p-2 animate-in fade-in duration-300">
        <SearchInput
          placeholder="Search design sessions..."
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={() => setSearchQuery("")}
          className="max-w-none"
          inputClassName="border-sidebar-border/80 bg-sidebar/70 text-sidebar-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex-1">
        {sessions === undefined ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="sm" />
          </div>
        ) : filteredSessions.length === 0 &&
          filteredArchivedSessions.length === 0 ? (
          <div className="p-4 text-center">
            <IconPalette
              size={28}
              className="mx-auto mb-2 text-muted-foreground"
            />
            <p className="text-sm text-muted-foreground">
              {sessions.length === 0 && (archivedSessions?.length ?? 0) === 0
                ? "No design sessions yet"
                : "No matches found"}
            </p>
          </div>
        ) : (
          <div>
            <AnimatePresence initial={false}>
              {filteredSessions.map((session) => {
                const isSelected = currentSessionId === session._id;
                return (
                  <ContextMenu key={session._id}>
                    <ContextMenuTrigger asChild>
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                        className={cn(
                          "group mx-1 rounded-md px-3 py-2 transition-all duration-200",
                          isSelected
                            ? "bg-sidebar-accent text-sidebar-primary shadow-xs"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/70",
                        )}
                      >
                        <SidebarSessionItem
                          href={`${baseUrl}/${session._id}`}
                          title={session.title}
                          userId={session.userId}
                          createdAt={session._creationTime}
                          updatedAt={session.updatedAt}
                          isSelected={isSelected}
                          onNavigate={onNavigate}
                        />
                      </motion.div>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem
                        className="text-warning"
                        onClick={() =>
                          setSessionToArchive({
                            id: session._id,
                            title: session.title,
                          })
                        }
                      >
                        <IconArchive size={16} />
                        Archive
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {filteredArchivedSessions.length > 0 && (
          <div className="mt-2 border-t border-sidebar-border/50">
            <button
              onClick={() => setIsArchiveOpen((prev) => !prev)}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-sidebar-foreground transition-colors"
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
                  const isSelected = currentSessionId === session._id;
                  return (
                    <motion.div
                      key={session._id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Link
                        href={`${baseUrl}/${session._id}`}
                        onClick={onNavigate}
                        className={cn(
                          "mx-1 block rounded-md px-3 py-2 transition-all duration-200",
                          isSelected
                            ? "bg-sidebar-accent text-sidebar-primary shadow-xs"
                            : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50",
                        )}
                      >
                        <h3 className="truncate text-sm">{session.title}</h3>
                        <span className="text-xs text-muted-foreground/60">
                          {dayjs(
                            session.updatedAt ?? session._creationTime,
                          ).fromNow()}
                        </span>
                      </Link>
                    </motion.div>
                  );
                })}
            </AnimatePresence>
          </div>
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
            <DialogTitle>Archive Design Session</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to archive{" "}
            <strong>{sessionToArchive?.title}</strong>?
          </p>
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
            <DialogTitle>New Design Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Session Title</label>
            <Input
              placeholder="e.g., Dashboard user management page"
              value={newSessionTitle}
              onChange={(event) => setNewSessionTitle(event.target.value)}
              autoFocus
              onKeyDown={(event) => {
                if (event.key === "Enter" && newSessionTitle.trim()) {
                  void handleCreate();
                }
              }}
            />
          </div>
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
    </>
  );
}
