"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/api";
import { useRepo } from "@/lib/contexts/RepoContext";
import { GenericId as Id } from "convex/values";
import { Button } from "@/lib/components/ui/button";
import { Input } from "@/lib/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/lib/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/lib/components/ui/dropdown-menu";
import { Spinner } from "@/lib/components/ui/spinner";
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
import { UserInitials } from "@/lib/components/ui/UserInitials";
import dayjs from "@/lib/dates";

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
      <div className="p-3">
        <div className="relative">
          <IconSearch size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
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
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-4 text-center">
            <IconTerminal2 className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
            <p className="text-sm text-neutral-500">
              {sessions.length === 0 ? "No sessions yet" : "No matches found"}
            </p>
          </div>
        ) : (
          <div className="py-2">
            {filteredSessions.map((session) => {
              const isSelected = currentSessionId === session._id;
              return (
                <div
                  key={session._id}
                  className={`px-4 py-2 cursor-pointer transition-all group ${
                    isSelected
                      ? "bg-primary/10"
                      : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  }`}
                >
                  <Link href={baseUrl + "/" + session._id} className="block">
                    <div className="flex items-center justify-between gap-2">
                      <h3
                        className={`text-sm font-medium truncate flex-1 ${
                          isSelected
                            ? "text-primary"
                            : "text-neutral-900 dark:text-white"
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
                            <button
                              type="button"
                              className="p-1 rounded transition-colors opacity-0 group-hover:opacity-100 hover:bg-muted text-neutral-400"
                            >
                              <IconDotsVertical size={14} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              className="text-amber-600"
                              onClick={() =>
                                setSessionToArchive({
                                  id: session._id,
                                  title: session.title,
                                })
                              }
                            >
                              <IconArchive size={16} className="mr-2" />
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
                      <span className="text-xs text-neutral-500 ml-auto">
                        {dayjs(session._creationTime).fromNow()}
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

      <Dialog open={!!sessionToArchive} onOpenChange={(v) => { if (!v) setSessionToArchive(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive Session</DialogTitle>
          </DialogHeader>
          <p className="text-foreground/80">
            Are you sure you want to archive{" "}
            <strong>{sessionToArchive?.title}</strong>?
          </p>
          <p className="text-sm text-muted-foreground mt-3">
            This will stop the sandbox and remove the session from the active
            list. The session data will be preserved but no longer accessible.
          </p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setSessionToArchive(null)}>
              Cancel
            </Button>
            <Button
              className="bg-amber-600 text-white hover:bg-amber-700"
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
              variant="secondary"
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
