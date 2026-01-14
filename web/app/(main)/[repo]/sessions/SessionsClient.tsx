"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/api";
import { useRepo } from "@/lib/contexts/RepoContext";
import { GenericId as Id } from "convex/values";
import { Container } from "@/lib/components/ui/Container";
import { PageHeader } from "@/lib/components/PageHeader";
import { EmptyState } from "@/lib/components/ui/EmptyState";
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
  IconChevronRight,
  IconGitBranch,
  IconTrash,
  IconSearch,
  IconPlus,
  IconExternalLink,
} from "@tabler/icons-react";
import Link from "next/link";
import { encodeRepoSlug } from "@/lib/utils/repoUrl";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

export function SessionsClient() {
  const { repo, fullName } = useRepo();
  const router = useRouter();
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
      await deleteSession({ id: sessionToDelete.id });
      setSessionToDelete(null);
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
      router.push("/" + encodeRepoSlug(fullName) + "/sessions/" + id);
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
    <>
      <PageHeader
        title="Sessions"
        headerRight={
          <Button
            color="primary"
            size="sm"
            startContent={<IconPlus size={16} />}
            onPress={() => setIsCreateModalOpen(true)}
          >
            New Session
          </Button>
        }
      />
      <Container>
        {sessions === undefined ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600" />
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState
            icon={IconTerminal2}
            title="No sessions yet"
            description="Start a new session to interact with Claude Code and make changes to your codebase."
            action={
              <Button
                color="primary"
                startContent={<IconPlus size={16} />}
                onPress={() => setIsCreateModalOpen(true)}
              >
                New Session
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-end">
              <Input
                placeholder="Search sessions..."
                size="sm"
                className="w-48"
                startContent={
                  <IconSearch size={16} className="text-default-400" />
                }
                value={searchQuery}
                onValueChange={setSearchQuery}
                isClearable
                onClear={() => setSearchQuery("")}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredSessions.map((session) => (
                <div
                  key={session._id}
                  className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-pink-300 dark:hover:border-pink-700 hover:shadow-sm transition-all group bg-white dark:bg-neutral-900"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={
                        "/" +
                        encodeRepoSlug(fullName) +
                        "/sessions/" +
                        session._id
                      }
                      className="flex-1 min-w-0"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-pink-600 transition-colors truncate">
                          {session.title}
                        </h3>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            session.status === "active"
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                              : "bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300"
                          }`}
                        >
                          {session.status}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                        {session.messages.length} messages ·{" "}
                        {getLastActivity(session)}
                      </p>
                      {session.branchName && (
                        <div className="flex items-center gap-1 text-xs text-neutral-500 truncate">
                          <IconGitBranch className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{session.branchName}</span>
                        </div>
                      )}
                      {session.prUrl && (
                        <div className="flex items-center gap-1 text-xs text-blue-500 mt-1">
                          <IconExternalLink className="w-3 h-3 flex-shrink-0" />
                          <span>PR opened</span>
                        </div>
                      )}
                    </Link>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Tooltip content="Delete session">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSessionToDelete({
                              id: session._id,
                              title: session.title,
                            });
                          }}
                          className="p-1 rounded-lg transition-colors hover:bg-danger-100 dark:hover:bg-danger-900/30 text-neutral-400 hover:text-danger-500"
                        >
                          <IconTrash size={16} />
                        </button>
                      </Tooltip>
                      <Link
                        href={
                          "/" +
                          encodeRepoSlug(fullName) +
                          "/sessions/" +
                          session._id
                        }
                        className="text-neutral-400 group-hover:text-pink-600 transition-colors p-1"
                      >
                        <IconChevronRight size={18} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Container>

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
    </>
  );
}
