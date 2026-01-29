"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/api";
import { useRepo } from "@/lib/contexts/RepoContext";
import { GenericId as Id } from "convex/values";
import { Button } from "@heroui/button";
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
  IconArchive,
  IconSearch,
  IconDotsVertical,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { encodeRepoSlug } from "@/lib/utils/repoUrl";
import { useState, useMemo } from "react";
import { SidebarLayoutWrapper } from "@/lib/components/SidebarLayoutWrapper";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
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
        await fetch("/api/sessions/cleanup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sandboxId: sessionData.sandboxId,
            sessionId: sessionToArchive.id,
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
      fetch("/api/sessions/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: id, action: "start" }),
      });
    } finally {
      setIsCreating(false);
    }
  };

  const sidebar = (
    <>
      <div className="px-3 pt-6 pb-3">
        <Input
          placeholder="Search sessions..."
          startContent={<IconSearch size={16} className="text-default-400" />}
          value={searchQuery}
          onValueChange={setSearchQuery}
          isClearable
          onClear={() => setSearchQuery("")}
        />
      </div>
      <div className="flex-1 overflow-y-auto scrollbar">
        {sessions === undefined ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600" />
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
                      ? "bg-teal-100 dark:bg-teal-900/20"
                      : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  }`}
                >
                  <Link href={baseUrl + "/" + session._id} className="block">
                    <div className="flex items-center justify-between gap-2">
                      <h3
                        className={`text-sm font-medium truncate flex-1 ${
                          isSelected
                            ? "text-teal-600 dark:text-teal-400"
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
                        <Dropdown>
                          <DropdownTrigger>
                            <button
                              type="button"
                              className="p-1 rounded transition-colors opacity-0 group-hover:opacity-100 hover:bg-default-200 text-neutral-400"
                            >
                              <IconDotsVertical size={14} />
                            </button>
                          </DropdownTrigger>
                          <DropdownMenu aria-label="Session actions">
                            <DropdownItem
                              key="archive"
                              className="text-warning"
                              color="warning"
                              startContent={<IconArchive size={16} />}
                              onPress={() =>
                                setSessionToArchive({
                                  id: session._id,
                                  title: session.title,
                                })
                              }
                            >
                              Archive
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center">
                      {session.createdBy && (
                        <UserInitials userId={session.createdBy} />
                      )}
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

      <Modal
        isOpen={!!sessionToArchive}
        onClose={() => setSessionToArchive(null)}
      >
        <ModalContent>
          <ModalHeader>Archive Session</ModalHeader>
          <ModalBody>
            <p className="text-default-600">
              Are you sure you want to archive{" "}
              <strong>{sessionToArchive?.title}</strong>?
            </p>
            <p className="text-sm text-default-500 mt-3">
              This will stop the sandbox and remove the session from the active
              list. The session data will be preserved but no longer accessible.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setSessionToArchive(null)}>
              Cancel
            </Button>
            <Button
              color="warning"
              onPress={handleArchive}
              isLoading={isArchiving}
            >
              Archive Session
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
    </SidebarLayoutWrapper>
  );
}
