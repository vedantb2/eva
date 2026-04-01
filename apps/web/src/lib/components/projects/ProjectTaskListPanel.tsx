"use client";

import type { Id } from "@conductor/backend";
import type { FunctionReturnType } from "convex/server";
import { api } from "@conductor/backend";
import { useMemo, useState } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
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
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Button,
} from "@conductor/ui";
import { QuickTaskCard } from "@/lib/components/quick-tasks/QuickTaskCard";
import {
  statusConfig,
  TASK_STATUSES,
} from "@/lib/components/tasks/TaskStatusBadge";
import { IconGripVertical, IconPlus } from "@tabler/icons-react";

type Task = FunctionReturnType<typeof api.agentTasks.listByProject>[number];
type TaskStatus = Task["status"];

function SortableTaskWrapper({
  task,
  selectedTaskId,
  onSelectTask,
  hasError,
}: {
  task: Task;
  selectedTaskId: Id<"agentTasks"> | null;
  onSelectTask: (id: Id<"agentTasks">) => void;
  hasError: boolean;
}) {
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
      className={`flex items-center gap-1 ${isDragging ? "opacity-50" : ""}`}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground shrink-0 p-0.5"
        {...attributes}
        {...listeners}
      >
        <IconGripVertical size={14} />
      </button>
      <div className="flex-1 min-w-0">
        <QuickTaskCard
          id={task._id}
          title={task.title}
          description={task.description}
          status={task.status}
          hasError={hasError}
          taskNumber={task.taskNumber ?? 0}
          tags={task.tags}
          createdAt={task._creationTime}
          scheduledAt={task.scheduledAt}
          isActive={selectedTaskId === task._id}
          onClick={() => onSelectTask(task._id)}
          assignedTo={task.assignedTo}
          model={task.model}
          projectId={task.projectId}
          repoId={task.repoId}
        />
      </div>
    </div>
  );
}

interface ProjectTaskListPanelProps {
  tasks: Task[];
  selectedTaskId: Id<"agentTasks"> | null;
  onSelectTask: (id: Id<"agentTasks">) => void;
  onCreateTask: () => void;
}

export function ProjectTaskListPanel({
  tasks,
  selectedTaskId,
  onSelectTask,
  onCreateTask,
}: ProjectTaskListPanelProps) {
  const [localTodoOrder, setLocalTodoOrder] = useState<
    Id<"agentTasks">[] | null
  >(null);
  const reorderTasks = useMutation(api.agentTasks.reorderProjectTasks);

  const taskIds = useMemo(() => tasks.map((t) => t._id), [tasks]);
  const errorTaskIds = useQuery(api.agentRuns.getTaskIdsWithLatestRunError, {
    taskIds,
  });
  const errorTaskIdSet = useMemo(
    () => new Set(errorTaskIds ?? []),
    [errorTaskIds],
  );

  const groupedTasks = useMemo(() => {
    const groups: Record<TaskStatus, Task[]> = {
      draft: [],
      todo: [],
      in_progress: [],
      code_review: [],
      business_review: [],
      done: [],
      cancelled: [],
    };
    for (const task of tasks) {
      groups[task.status].push(task);
    }
    return groups;
  }, [tasks]);

  const todoTasks = useMemo(() => {
    if (!localTodoOrder) return groupedTasks.todo;
    const taskMap = new Map(groupedTasks.todo.map((t) => [t._id, t]));
    const ordered: Task[] = [];
    for (const id of localTodoOrder) {
      const task = taskMap.get(id);
      if (task) ordered.push(task);
    }
    for (const task of groupedTasks.todo) {
      if (!localTodoOrder.includes(task._id)) ordered.push(task);
    }
    return ordered;
  }, [groupedTasks.todo, localTodoOrder]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = todoTasks.findIndex((t) => t._id === active.id);
    const newIndex = todoTasks.findIndex((t) => t._id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const currentOrder = todoTasks.map((t) => t._id);
    const newOrder = arrayMove(currentOrder, oldIndex, newIndex);
    setLocalTodoOrder(newOrder);

    const projectId = todoTasks[0]?.projectId;
    if (projectId) {
      reorderTasks({
        projectId,
        taskIds: newOrder,
      }).then(() => {
        setLocalTodoOrder(null);
      });
    }
  };

  const nonEmptyStatuses = TASK_STATUSES.filter(
    (status) => groupedTasks[status].length > 0,
  );
  const defaultExpandedKeys = nonEmptyStatuses.filter(
    (s) => s !== "done" && s !== "cancelled",
  );

  return (
    <div className="h-full overflow-y-auto scrollbar">
      <Accordion
        type="multiple"
        className="px-3 [&_hr]:bg-border"
        defaultValue={defaultExpandedKeys}
      >
        {TASK_STATUSES.map((status) => {
          const config = statusConfig[status];
          const StatusIcon = config.icon;
          const statusTasks =
            status === "todo" ? todoTasks : groupedTasks[status];

          if (status === "todo" && statusTasks.length > 0) {
            return (
              <AccordionItem key={status} value={status}>
                <AccordionTrigger className="p-2 hover:no-underline">
                  <div className="flex flex-1 items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <StatusIcon size={14} className={config.text} />
                      <span className={`text-sm font-medium ${config.text}`}>
                        {config.label}
                      </span>
                      <span className="text-xs text-muted-foreground/60 tabular-nums">
                        {statusTasks.length}
                      </span>
                    </div>
                    <Button
                      size="icon-sm"
                      variant="outline"
                      className="mr-2 h-6 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateTask();
                      }}
                    >
                      <IconPlus size={12} />
                    </Button>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="flex flex-col gap-2 px-3">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={statusTasks.map((t) => t._id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {statusTasks.map((task) => (
                        <SortableTaskWrapper
                          key={task._id}
                          task={task}
                          selectedTaskId={selectedTaskId}
                          onSelectTask={onSelectTask}
                          hasError={errorTaskIdSet.has(task._id)}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                </AccordionContent>
              </AccordionItem>
            );
          }

          return (
            <AccordionItem key={status} value={status}>
              <AccordionTrigger className="p-2 hover:no-underline">
                <div
                  className={`flex items-center gap-1.5 ${status === "todo" ? "flex-1 justify-between" : ""}`}
                >
                  <div className="flex items-center gap-1.5">
                    <StatusIcon size={14} className={config.text} />
                    <span className={`text-sm font-medium ${config.text}`}>
                      {config.label}
                    </span>
                    <span className="text-xs text-muted-foreground/60 tabular-nums">
                      {statusTasks.length}
                    </span>
                  </div>
                  {status === "todo" && (
                    <Button
                      size="icon-sm"
                      variant="outline"
                      className="mr-2 h-6 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateTask();
                      }}
                    >
                      <IconPlus size={12} />
                    </Button>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-2 px-3">
                {statusTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">No tasks</p>
                ) : (
                  statusTasks.map((task) => (
                    <QuickTaskCard
                      key={task._id}
                      id={task._id}
                      title={task.title}
                      description={task.description}
                      status={task.status}
                      hasError={errorTaskIdSet.has(task._id)}
                      taskNumber={task.taskNumber ?? 0}
                      tags={task.tags}
                      createdAt={task._creationTime}
                      scheduledAt={task.scheduledAt}
                      isActive={selectedTaskId === task._id}
                      onClick={() => onSelectTask(task._id)}
                      assignedTo={task.assignedTo}
                      model={task.model}
                      projectId={task.projectId}
                      repoId={task.repoId}
                    />
                  ))
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
