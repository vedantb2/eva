"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/api";
import { useRepo } from "@/lib/contexts/RepoContext";
import { GenericId as Id } from "convex/values";
import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { Input } from "@heroui/input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import {
  IconTerminal2,
  IconTrash,
  IconSearch,
  IconPlus,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { encodeRepoSlug } from "@/lib/utils/repoUrl";
import { useState, useMemo } from "react";

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
  const deleteSession = useMutation(api.sessions.remove);
  const [sessionToDelete, setSessionToDelete] = useState<{
    id: Id<"sessions">;
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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
    if (!query) return sessions;
    return sessions.filter((s) => s.title.toLowerCase().includes(query));
  }, [sessions, searchQuery]);

  const handleDelete = async () => {
    if (!sessionToDelete) return;
    setIsDeleting(true);
    try {
      const sessionData = sessions?.find((s) => s._id === sessionToDelete.id);
      if (sessionData?.sandboxId) {
        await fetch("/api/sessions/cleanup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sandboxId: sessionData.sandboxId,
            sessionId: sessionToDelete.id,
          }),
        });
      }
      await deleteSession({ id: sessionToDelete.id });
      setSessionToDelete(null);
      if (currentSessionId === sessionToDelete.id) {
        router.push(baseUrl);
      }
    } finally {
      setIsDeleting(false);
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
    } finally {
      setIsCreating(false);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getLastActivity = (
    session: NonNullable<typeof sessions>[number]
  ): string => {
    if (session.messages.length === 0) {
      return formatTime(session._creationTime);
    }
    const lastMessage = session.messages[session.messages.length - 1];
    return formatTime(lastMessage.timestamp);
  };

  return (
    <div className="flex h-[calc(100vh-1.5rem)]">
      <div className="w-80 border-r border-neutral-200 dark:border-neutral-800 flex flex-col">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Sessions
            </h2>
            <Button
              size="sm"
              color="primary"
              isIconOnly
              onPress={() => setIsCreateModalOpen(true)}
            >
              <IconPlus size={16} />
            </Button>
          </div>
          <Input
            placeholder="Search sessions..."
            size="sm"
            startContent={<IconSearch size={16} className="text-default-400" />}
            value={searchQuery}
            onValueChange={setSearchQuery}
            isClearable
            onClear={() => setSearchQuery("")}
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {sessions === undefined ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600" />
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="p-4 text-center">
              <IconTerminal2 className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
              <p className="text-sm text-neutral-500">
                {sessions.length === 0 ? "No sessions yet" : "No matches found"}
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredSessions.map((session) => {
                const isSelected = currentSessionId === session._id;
                return (
                  <div
                    key={session._id}
                    className={`px-3 py-2 rounded-lg cursor-pointer transition-all group ${
                      isSelected
                        ? "bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800"
                        : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    }`}
                  >
                    <Link href={baseUrl + "/" + session._id} className="block">
                      <div className="flex items-center justify-between gap-2">
                        <h3
                          className={`text-sm font-medium truncate flex-1 ${
                            isSelected
                              ? "text-pink-600 dark:text-pink-400"
                              : "text-neutral-900 dark:text-white"
                          }`}
                        >
                          {session.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-neutral-500 flex-shrink-0">
                            {getLastActivity(session)}
                          </span>
                          <Tooltip content="Delete session">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSessionToDelete({
                                  id: session._id,
                                  title: session.title,
                                });
                              }}
                              className="p-1 rounded transition-colors opacity-0 group-hover:opacity-100 hover:bg-danger-100 dark:hover:bg-danger-900/30 text-neutral-400 hover:text-danger-500"
                            >
                              <IconTrash size={14} />
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-hidden">{children}</div>

      <Modal
        isOpen={!!sessionToDelete}
        onClose={() => setSessionToDelete(null)}
      >
        <ModalContent>
          <ModalHeader>Delete Session</ModalHeader>
          <ModalBody>
            <p className="text-default-600">
              Are you sure you want to delete{" "}
              <strong>{sessionToDelete?.title}</strong>?
            </p>
            <p className="text-sm text-default-500 mt-3">
              This action cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setSessionToDelete(null)}>
              Cancel
            </Button>
            <Button
              color="danger"
              onPress={handleDelete}
              isLoading={isDeleting}
            >
              Delete Session
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setNewSessionTitle("");
        }}
      >
        <ModalContent>
          <ModalHeader>New Session</ModalHeader>
          <ModalBody>
            <Input
              label="Session Title"
              placeholder="e.g., Add user authentication"
              value={newSessionTitle}
              onValueChange={setNewSessionTitle}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && newSessionTitle.trim()) {
                  handleCreate();
                }
              }}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={() => {
                setIsCreateModalOpen(false);
                setNewSessionTitle("");
              }}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleCreate}
              isLoading={isCreating}
              isDisabled={!newSessionTitle.trim()}
            >
              Create Session
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
