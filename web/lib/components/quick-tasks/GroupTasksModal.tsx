"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/api";
import { GenericId as Id } from "convex/values";
import { useRepo } from "@/lib/contexts/RepoContext";
import { useRouter } from "next/navigation";
import { encodeRepoSlug } from "@/lib/utils/repoUrl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Spinner,
} from "@conductor/ui";
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
  const [selectedProjectId, setSelectedProjectId] =
    useState<Id<"projects"> | null>(null);
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
    <Dialog
      open={isOpen}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            Group {selectedTaskIds.size} task
            {selectedTaskIds.size !== 1 ? "s" : ""} into project
          </DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="new" className="flex-1">
              New Project
            </TabsTrigger>
            <TabsTrigger value="existing" className="flex-1">
              Existing Project
            </TabsTrigger>
          </TabsList>
          <TabsContent value="new">
            <div className="pt-2 space-y-1.5">
              <label className="text-sm font-medium">Project title</label>
              <Input
                placeholder="e.g. Bug fixes, UI improvements..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>
          </TabsContent>
          <TabsContent value="existing">
            <div className="pt-2 space-y-2 max-h-80 overflow-y-auto">
              {projects?.filter(
                (p) => p.phase === "active" || p.phase === "completed",
              ).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No active projects
                </p>
              )}
              {projects
                ?.filter((p) => p.phase === "active" || p.phase === "completed")
                .map((project) => (
                  <button
                    key={project._id}
                    type="button"
                    onClick={() => setSelectedProjectId(project._id)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                      selectedProjectId === project._id
                        ? "border-primary bg-primary/10"
                        : "border-transparent bg-muted hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {project.title}
                      </span>
                      <ProjectPhaseBadge phase={project.phase} />
                    </div>
                    {project.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {project.description}
                      </p>
                    )}
                  </button>
                ))}
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          {activeTab === "new" ? (
            <Button
              onClick={handleCreate}
              disabled={isLoading || !title.trim()}
            >
              {isLoading && <Spinner size="sm" />}
              Create Project
            </Button>
          ) : (
            <Button
              onClick={handleAddToProject}
              disabled={isLoading || !selectedProjectId}
            >
              {isLoading && <Spinner size="sm" />}
              Add to Project
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
