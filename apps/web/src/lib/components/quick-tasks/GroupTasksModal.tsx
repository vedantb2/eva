"use client";

import { useState } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation, useConvex } from "convex/react";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
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
  ListRow,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Spinner,
} from "@eva/ui";
import { ProjectPhaseBadge } from "@/lib/components/projects/ProjectPhaseBadge";
import { MarqueeOnHover } from "@/lib/components/ui/MarqueeOnHover";
import { entityPathSegment } from "@/lib/numId";
import { IconGripVertical } from "@tabler/icons-react";
import { toInternalRepoHref } from "@/lib/utils/repoUrl";

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
      className={`group flex items-center gap-2 rounded-surface bg-muted/40 px-2 py-1.5 ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label="Reorder task"
        className="cursor-grab touch-none text-muted-foreground"
        {...attributes}
        {...listeners}
      >
        <IconGripVertical />
      </Button>
      <span className="w-5 shrink-0 text-right font-mono text-2xs text-muted-foreground">
        {index + 1}
      </span>
      <MarqueeOnHover className="min-w-0 text-2sm">{task.title}</MarqueeOnHover>
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
  const convex = useConvex();
  const [title, setTitle] = useState("");
  const [selectedProjectId, setSelectedProjectId] =
    useState<Id<"projects"> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("new");
  const [orderedTasks, setOrderedTasks] = useState(selectedTasks);
  const [syncKey, setSyncKey] = useState<{ open: boolean; ids: string }>({
    open: false,
    ids: "",
  });
  const selectedIds = selectedTasks.map((task) => task._id).join(",");
  // Reset order when the modal opens or the selection set changes.
  if (isOpen && (!syncKey.open || syncKey.ids !== selectedIds)) {
    setSyncKey({ open: true, ids: selectedIds });
    setOrderedTasks(selectedTasks);
  } else if (!isOpen && syncKey.open) {
    setSyncKey({ open: false, ids: "" });
  }

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
      const created = await convex.query(api.projects.get, { id: projectId });
      setTitle("");
      onSuccess();
      onClose();
      // Nested ifs rather than a ternary: React Compiler bails on the whole
      // file when a conditional expression sits inside a try/catch.
      if (created) {
        const segment = entityPathSegment(created);
        if (segment) {
          navigate({
            to: toInternalRepoHref(`${basePath}/projects/${segment}`),
          });
        }
      }
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
    setIsLoading(false);
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
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
    setIsLoading(false);
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
                (p) =>
                  p.phase === "in_progress" ||
                  p.phase === "business_review" ||
                  p.phase === "code_review" ||
                  p.phase === "completed",
              ).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No active projects
                </p>
              )}
              {projects?.flatMap((project) =>
                project.phase === "in_progress" ||
                project.phase === "business_review" ||
                project.phase === "code_review" ||
                project.phase === "completed"
                  ? [
                      <ListRow
                        key={project._id}
                        density="compact"
                        aria-label={project.title}
                        selected={selectedProjectId === project._id}
                        onClick={() => setSelectedProjectId(project._id)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-2sm font-medium">
                            {project.title}
                          </span>
                          <ProjectPhaseBadge phase={project.phase} />
                        </div>
                        {project.description && (
                          <p className="mt-0.5 line-clamp-1 text-2xs text-muted-foreground">
                            {project.description}
                          </p>
                        )}
                      </ListRow>,
                    ]
                  : [],
              )}
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
