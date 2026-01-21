"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/api";
import { GenericId as Id } from "convex/values";
import { useState } from "react";
import { KanbanBoard } from "@/lib/components/kanban/KanbanBoard";
import { FeatureTaskCard } from "./FeatureTaskCard";
import { TaskDetailModal } from "@/lib/components/tasks/TaskDetailModal";
import { Card, CardBody } from "@heroui/card";

type TaskStatus = "todo" | "in_progress" | "code_review" | "done";

interface Task {
  _id: Id<"agentTasks">;
  title: string;
  description?: string;
  status: TaskStatus;
  taskNumber?: number;
  branchName?: string;
  order: number;
}

interface FeatureKanbanBoardProps {
  featureId: Id<"features">;
}

export function FeatureKanbanBoard({ featureId }: FeatureKanbanBoardProps) {
  const tasks = useQuery(api.agentTasks.listByFeature, { featureId });
  const updateStatus = useMutation(api.agentTasks.updateStatus);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  if (!tasks) {
    return <div>Loading...</div>;
  }

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    await updateStatus({ id: id as Id<"agentTasks">, status });
  };

  return (
    <>
      <KanbanBoard
        items={tasks}
        onStatusChange={handleStatusChange}
        onItemClick={setSelectedTask}
        heightClass="min-h-[400px] sm:min-h-[500px] h-[calc(100vh-250px)] sm:h-[calc(100vh-230px)]"
        renderCard={(task) => (
          <FeatureTaskCard
            id={task._id}
            taskNumber={task.taskNumber ?? 0}
            title={task.title}
            description={task.description}
            status={task.status}
            branchName={task.branchName}
          />
        )}
        renderOverlay={(task) => (
          <Card shadow="none" className="w-[240px] sm:w-[280px]">
            <CardBody className="p-3">
              <span className="text-default-400 font-mono text-sm">
                #{task.taskNumber}
              </span>
              <span className="ml-2 font-medium text-sm">
                {task.title}
              </span>
            </CardBody>
          </Card>
        )}
      />
      {selectedTask && (
        <TaskDetailModal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          taskId={selectedTask._id}
          taskNumber={selectedTask.taskNumber}
          title={selectedTask.title}
          description={selectedTask.description}
          status={selectedTask.status}
          branchName={selectedTask.branchName}
        />
      )}
    </>
  );
}
