"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "@conductor/backend";
import { api } from "@conductor/backend";
import { UserInitials } from "@conductor/shared";
import dayjs from "@conductor/shared/dates";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Spinner,
  cn,
} from "@conductor/ui";
import {
  IconArchive,
  IconDotsVertical,
  IconSearch,
  IconTerminal2,
} from "@tabler/icons-react";

interface SessionsSidebarProps {
  repoId: Id<"githubRepos">;
  repoSlug: string;
  pathname: string;
  onNavigate?: () => void;
  createRequestId?: number;
}

export function SessionsSidebar({
  repoId,
  repoSlug,
  pathname,
  onNavigate,
  createRequestId,
}: SessionsSidebarProps) {
  const router = useRouter();
  const sessions = useQuery(api.sessions.list, { repoId });
  const createSession = useMutation(api.sessions.create);
  const archiveSession = useMutation(api.sessions.archive);

  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [sessionToArchive, setSessionToArchive] = useState<{
    id: Id<"sessions">;
    title: string;
  } | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  const baseUrl = `/${repoSlug}/sessions`;
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

  useEffect(() => {
    if (createRequestId && createRequestId > 0) {
      setIsCreateModalOpen(true);
    }
  }, [createRequestId]);

  const handleArchive = async () => {
    if (!sessionToArchive) return;
    setIsArchiving(true);
    try {
      const sessionData = sessions?.find(
        (session) => session._id === sessionToArchive.id,
      );
      if (sessionData?.sandboxId) {
        await fetch("/api/inngest/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "session/sandbox.stop",
            data: { sessionId: sessionToArchive.id },
          }),
        });
      }

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

      void fetch("/api/inngest/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "session/sandbox.start",
          data: { sessionId: id },
        }),
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <div className="p-2">
        <div className="relative">
          <IconSearch
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search sessions..."
            className="h-8 border-sidebar-border/80 bg-sidebar/70 pl-8 text-sm text-sidebar-foreground placeholder:text-muted-foreground"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
      </div>

      <div className="flex-1">
        {sessions === undefined ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="sm" />
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-4 text-center">
            <IconTerminal2
              size={28}
              className="mx-auto mb-2 text-muted-foreground"
            />
            <p className="text-sm text-muted-foreground">
              {sessions.length === 0 ? "No sessions yet" : "No matches found"}
            </p>
          </div>
        ) : (
          <div>
            {filteredSessions.map((session) => {
              const isSelected = currentSessionId === session._id;
              return (
                <div
                  key={session._id}
                  className={cn(
                    "group mx-1 rounded-md px-3 py-2 transition-colors",
                    isSelected
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/70",
                  )}
                >
                  <Link
                    href={`${baseUrl}/${session._id}`}
                    onClick={onNavigate}
                    className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3
                        className={cn(
                          "truncate text-sm font-medium",
                          isSelected
                            ? "text-sidebar-primary"
                            : "text-sidebar-foreground",
                        )}
                      >
                        {session.title}
                      </h3>
                      <div
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                        }}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            >
                              <IconDotsVertical size={13} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
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
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center">
                      <div className="flex -space-x-1">
                        {[
                          ...new Set(
                            session.messages.map((message) => message.userId),
                          ),
                        ]
                          .filter(Boolean)
                          .map((id) => (
                            <UserInitials key={id} userId={id!} />
                          ))}
                      </div>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {dayjs(
                          session.updatedAt ?? session._creationTime,
                        ).fromNow()}
                      </span>
                    </div>
                  </Link>
                </div>
              );
            })}
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
            <DialogTitle>Archive Session</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to archive{" "}
            <strong>{sessionToArchive?.title}</strong>?
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            This will stop the sandbox and remove the session from the active
            list.
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
              {isArchiving ? <Spinner size="sm" /> : "Archive Session"}
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
            <DialogTitle>New Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Session Title</label>
            <Input
              placeholder="e.g., Add user authentication"
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
