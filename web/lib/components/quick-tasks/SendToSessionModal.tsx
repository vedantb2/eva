"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/api";
import { GenericId as Id } from "convex/values";
import { useRouter } from "next/navigation";
import { useRepo } from "@/lib/contexts/RepoContext";
import { encodeRepoSlug } from "@/lib/utils/repoUrl";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Tab, Tabs } from "@heroui/tabs";
import { Listbox, ListboxItem } from "@heroui/listbox";
import { IconTerminal2 } from "@tabler/icons-react";
import dayjs from "@/lib/dates";

interface SendToSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskIds: Id<"agentTasks">[];
  repoId: Id<"githubRepos">;
  onDone: () => void;
}

export function SendToSessionModal({
  isOpen,
  onClose,
  taskIds,
  repoId,
  onDone,
}: SendToSessionModalProps) {
  const router = useRouter();
  const { fullName } = useRepo();
  const sessions = useQuery(api.sessions.list, { repoId });
  const createSession = useMutation(api.sessions.create);
  const linkTasks = useMutation(api.agentTasks.linkTasksToSession);
  const [title, setTitle] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState<Id<"sessions"> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateNew = async () => {
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      const sessionId = await createSession({ repoId, title: title.trim(), taskIds });
      onDone();
      router.push(`/${encodeRepoSlug(fullName)}/sessions/${sessionId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddToExisting = async () => {
    if (!selectedSessionId) return;
    setIsSubmitting(true);
    try {
      await linkTasks({ taskIds, sessionId: selectedSessionId });
      onDone();
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeSessions = sessions?.filter((s) => s.status === "active") ?? [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" backdrop="blur">
      <ModalContent>
        <ModalHeader>Send {taskIds.length} task{taskIds.length !== 1 && "s"} to Session</ModalHeader>
        <ModalBody>
          <Tabs aria-label="Session options" fullWidth>
            <Tab key="new" title="New Session">
              <div className="space-y-4 pt-2">
                <Input
                  label="Session Title"
                  placeholder="Enter session title..."
                  value={title}
                  onValueChange={setTitle}
                  autoFocus
                />
                <Button
                  color="primary"
                  onPress={handleCreateNew}
                  isLoading={isSubmitting}
                  isDisabled={!title.trim()}
                  fullWidth
                >
                  Create Session
                </Button>
              </div>
            </Tab>
            <Tab key="existing" title="Existing Session">
              <div className="space-y-4 pt-2">
                {activeSessions.length === 0 ? (
                  <p className="text-sm text-default-500 text-center py-4">No active sessions</p>
                ) : (
                  <Listbox
                    aria-label="Select a session"
                    selectionMode="single"
                    selectedKeys={selectedSessionId ? [selectedSessionId] : []}
                    onSelectionChange={(keys) => {
                      const key = Array.from(keys)[0];
                      setSelectedSessionId(key ? (String(key) as Id<"sessions">) : null);
                    }}
                    className="max-h-60 overflow-y-auto"
                  >
                    {activeSessions.map((session) => (
                      <ListboxItem
                        key={session._id}
                        startContent={<IconTerminal2 size={16} className="text-default-400" />}
                        description={dayjs(session._creationTime).fromNow()}
                      >
                        {session.title}
                      </ListboxItem>
                    ))}
                  </Listbox>
                )}
                <Button
                  color="primary"
                  onPress={handleAddToExisting}
                  isLoading={isSubmitting}
                  isDisabled={!selectedSessionId}
                  fullWidth
                >
                  Add to Session
                </Button>
              </div>
            </Tab>
          </Tabs>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
