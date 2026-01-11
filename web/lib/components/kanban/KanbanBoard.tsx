"use client";

import { Id } from "../../../../backend/convex/_generated/dataModel";
import { KanbanColumn } from "./KanbanColumn";

type TaskStatus = "todo" | "in_progress" | "done";

interface Task {
  _id: Id<"tasks">;
  projectId: Id<"projects">;
  title: string;
  description?: string;
  status: TaskStatus;
  order: number;
  createdAt: number;
  updatedAt: number;
}

interface KanbanBoardProps {
  projectId: Id<"projects">;
  tasks: Task[];
}

const columns: { id: TaskStatus; title: string }[] = [
  { id: "todo", title: "Todo" },
  { id: "in_progress", title: "In Progress" },
  { id: "done", title: "Done" },
];

export function KanbanBoard({ projectId, tasks }: KanbanBoardProps) {
  const tasksByStatus = columns.map((col) => ({
    ...col,
    tasks: tasks
      .filter((t) => t.status === col.id)
      .sort((a, b) => a.order - b.order),
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-[calc(100vh-200px)]">
      {tasksByStatus.map((column) => (
        <KanbanColumn
          key={column.id}
          id={column.id}
          title={column.title}
          tasks={column.tasks}
          projectId={projectId}
        />
      ))}
    </div>
  );
}
