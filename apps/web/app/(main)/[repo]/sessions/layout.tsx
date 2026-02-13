"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import type { Id } from "@conductor/backend";
import {
  Button,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Spinner,
} from "@conductor/ui";
import {
  IconTerminal2,
  IconArchive,
  IconSearch,
  IconDotsVertical,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { encodeRepoSlug } from "@/lib/utils/repoUrl";
import { useState, useMemo } from "react";
import { SidebarLayoutWrapper } from "@/lib/components/SidebarLayoutWrapper";
import { UserInitials } from "@conductor/shared";
import dayjs from "@conductor/shared/dates";

export default function SessionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { repo, fullName } = useRepo();
  const router = useRouter();
  const pathname = usePathname();
  const sessions = useQuery(api.sessions.list, { repoId: repo._id });
  const createSession = useMutation(api.sessions.create);
  const archiveSession = useMutation(api.sessions.archive);
  const [sessionToArchive, setSessionToArchive] = useState<{
    id: Id<"sessions">;
    title: string;
  } | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const baseUrl = "/" + encodeRepoSlug(fullName) + "/sessions";
  const currentSessionId = pathname.startsWith(baseUrl + "/")
    ? pathname.slice(baseUrl.length + 1)
    : null;

  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    const query = searchQuery.toLowerCase().trim();
    return query
      ? sessions.filter((s) => s.title.toLowerCase().includes(query))
      : sessions;
  }, [sessions, searchQuery]);

  const handleArchive = async () => {
    if (!sessionToArchive) return;
    setIsArchiving(true);
    try {
      const sessionData = sessions?.find((s) => s._id === sessionToArchive.id);
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
        repoId: repo._id,
        title: newSessionTitle.trim(),
      });
      setNewSessionTitle("");
      setIsCreateModalOpen(false);
      router.push(baseUrl + "/" + id);
      fetch("/api/inngest/send", {
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

  const sidebar = (
    <>
      <div className="p-2">
        <div className="relative">
          <IconSearch
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search sessions..."
            className="h-8 pl-8 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar">
        {sessions === undefined ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="sm" />
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-4 text-center">
            <IconTerminal2
              size={32}
              className="mx-auto text-muted-foreground mb-2"
            />
            <p className="text-sm text-muted-foreground">
              {sessions.length === 0 ? "No sessions yet" : "No matches found"}
            </p>
          </div>
        ) : (
          <div className="py-1.5">
            {filteredSessions.map((session) => {
              const isSelected = currentSessionId === session._id;
              return (
                <div
                  key={session._id}
                  className={`px-2 py-1.5 mx-1 rounded-md cursor-pointer transition-colors duration-150 group ${
                    isSelected ? "bg-accent" : "hover:bg-muted"
                  }`}
                >
                  <Link href={baseUrl + "/" + session._id} className="block">
                    <div className="flex items-center justify-between">
                      <h3
                        className={`text-sm font-medium truncate flex-1 ${
                          isSelected ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {session.title}
                      </h3>
                      <div
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              className="opacity-0 group-hover:opacity-100"
                            >
                              <IconDotsVertical size={14} />
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
                            session.messages
                              .filter((m) => m.userId)
                              .map((m) => m.userId),
                          ),
                        ].map((id) => (
                          <UserInitials key={id} userId={id!} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground ml-auto">
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
    </>
  );

  return (
    <SidebarLayoutWrapper
      title="Sessions"
      onAdd={() => setIsCreateModalOpen(true)}
      sidebar={sidebar}
    >
      {children}

      <Dialog
        open={!!sessionToArchive}
        onOpenChange={(v) => {
          if (!v) setSessionToArchive(null);
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
          <p className="text-sm text-muted-foreground mt-3">
            This will stop the sandbox and remove the session from the active
            list. The session data will be preserved but no longer accessible.
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
        onOpenChange={(v) => {
          if (!v) {
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
              onChange={(e) => setNewSessionTitle(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && newSessionTitle.trim()) {
                  handleCreate();
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
    </SidebarLayoutWrapper>
  );
}
