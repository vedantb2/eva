"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import { useRepo } from "@/lib/contexts/RepoContext";
import { useNavigate } from "@tanstack/react-router";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
import { IconGripVertical } from "@tabler/icons-react";

type Task = FunctionReturnType<typeof api.agentTasks.getAllTasks>[number];

interface GroupTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTasks: Task[];
  onSuccess: () => void;
}

function SortableTaskItem({ task, index }: { task: Task; index: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 bg-muted/40 ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <IconGripVertical size={16} />
      </button>
      <span className="text-xs font-mono text-muted-foreground w-5 text-right shrink-0">
        {index + 1}
      </span>
      <span className="text-sm truncate">{task.title}</span>
    </div>
  );
}

export function GroupTasksModal({
  isOpen,
  onClose,
  selectedTasks,
  onSuccess,
}: GroupTasksModalProps) {
  const { repo, basePath } = useRepo();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [selectedProjectId, setSelectedProjectId] =
    useState<Id<"projects"> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("new");
  const [orderedTasks, setOrderedTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (isOpen) {
      setOrderedTasks(selectedTasks);
    }
  }, [isOpen, selectedTasks]);

  const projects = useQuery(api.projects.list, { repoId: repo._id });
  const createFromTasks = useMutation(api.projects.createFromTasks);
  const assignToProject = useMutation(api.agentTasks.assignToProject);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrderedTasks((prev) => {
      const oldIndex = prev.findIndex((t) => t._id === active.id);
      const newIndex = prev.findIndex((t) => t._id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const taskIds = orderedTasks.map((t) => t._id);

  const handleCreate = async () => {
    if (!title.trim() || taskIds.length === 0) return;
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
      navigate({ to: `${basePath}/projects/${projectId}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToProject = async () => {
    if (!selectedProjectId || taskIds.length === 0) return;
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
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            Group {orderedTasks.length} task
            {orderedTasks.length !== 1 ? "s" : ""} into project
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-1">
          <label className="text-sm font-medium text-muted-foreground">
            Task order (drag to reorder)
          </label>
          <div className="max-h-48 overflow-y-auto space-y-1">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={orderedTasks.map((t) => t._id)}
                strategy={verticalListSortingStrategy}
              >
                {orderedTasks.map((task, i) => (
                  <SortableTaskItem key={task._id} task={task} index={i} />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        </div>

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
                    className={`w-full rounded-lg p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 ${
                      selectedProjectId === project._id
                        ? "ring-2 ring-primary bg-accent"
                        : "bg-muted hover:bg-accent/70"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate">
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
              disabled={isLoading || !title.trim() || taskIds.length === 0}
            >
              {isLoading && <Spinner size="sm" />}
              Create Project
            </Button>
          ) : (
            <Button
              onClick={handleAddToProject}
              disabled={isLoading || !selectedProjectId || taskIds.length === 0}
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
