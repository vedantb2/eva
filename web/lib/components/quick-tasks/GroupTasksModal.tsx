"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/api";
import { GenericId as Id } from "convex/values";
import { useRepo } from "@/lib/contexts/RepoContext";
import { useRouter } from "next/navigation";
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
import { ProjectPhaseBadge } from "@/lib/components/projects/ProjectPhaseBadge";

interface GroupTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTaskIds: Set<Id<"agentTasks">>;
  onSuccess: () => void;
}

export function GroupTasksModal({
  isOpen,
  onClose,
  selectedTaskIds,
  onSuccess,
}: GroupTasksModalProps) {
  const { repo, fullName } = useRepo();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<Id<"projects"> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("new");

  const projects = useQuery(api.projects.list, { repoId: repo._id });
  const createFromTasks = useMutation(api.projects.createFromTasks);
  const assignToProject = useMutation(api.agentTasks.assignToProject);

  const taskIds = [...selectedTaskIds];

  const handleCreate = async () => {
    if (!title.trim()) return;
    setIsLoading(true);
    try {
      const projectId = await createFromTasks({
        repoId: repo._id,
        title: title.trim(),
        taskIds,
      });
      setTitle("");
      onSuccess();
      onClose();
      router.push(`/${encodeRepoSlug(fullName)}/projects/${projectId}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToProject = async () => {
    if (!selectedProjectId) return;
    setIsLoading(true);
    try {
      await assignToProject({
        taskIds,
        projectId: selectedProjectId,
      });
      setSelectedProjectId(null);
      onSuccess();
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalContent>
        <ModalHeader>
          Group {selectedTaskIds.size} task{selectedTaskIds.size !== 1 ? "s" : ""} into project
        </ModalHeader>
        <ModalBody>
          <Tabs
            aria-label="Group options"
            fullWidth
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
          >
            <Tab key="new" title="New Project">
              <div className="pt-2">
                <Input
                  label="Project title"
                  placeholder="e.g. Bug fixes, UI improvements..."
                  value={title}
                  onValueChange={setTitle}
                  autoFocus
                />
              </div>
            </Tab>
            <Tab key="existing" title="Existing Project">
              <div className="pt-2 space-y-2 max-h-80 overflow-y-auto">
                {projects?.filter((p) => p.phase === "active" || p.phase === "completed").length === 0 && (
                  <p className="text-sm text-default-400 text-center py-4">
                    No active projects
                  </p>
                )}
                {projects?.filter((p) => p.phase === "active" || p.phase === "completed").map((project) => (
                  <button
                    key={project._id}
                    type="button"
                    onClick={() => setSelectedProjectId(project._id)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                      selectedProjectId === project._id
                        ? "border-teal-500 bg-teal-100 dark:bg-teal-800/40"
                        : "border-transparent bg-default-100 dark:bg-neutral-800 hover:bg-default-200 dark:hover:bg-neutral-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{project.title}</span>
                      <ProjectPhaseBadge phase={project.phase} />
                    </div>
                    {project.description && (
                      <p className="text-xs text-default-400 mt-1 line-clamp-1">
                        {project.description}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </Tab>
          </Tabs>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>
            Cancel
          </Button>
          {activeTab === "new" ? (
            <Button
              color="primary"
              onPress={handleCreate}
              isLoading={isLoading}
              isDisabled={!title.trim()}
            >
              Create Project
            </Button>
          ) : (
            <Button
              color="primary"
              onPress={handleAddToProject}
              isLoading={isLoading}
              isDisabled={!selectedProjectId}
            >
              Add to Project
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
