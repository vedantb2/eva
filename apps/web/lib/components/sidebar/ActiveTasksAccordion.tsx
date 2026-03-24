"use client";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@conductor/ui";
import { useQuery } from "convex/react";
import { api } from "@conductor/backend";
import { TaskStatusBadge } from "@/lib/components/tasks/TaskStatusBadge";
import { IconListCheck } from "@tabler/icons-react";
import type { Id } from "@conductor/backend";
import { useRouter } from "next/navigation";

interface ActiveTasksAccordionProps {
  repoId?: Id<"githubRepos">;
  basePath: string;
}

export function ActiveTasksAccordion({
  repoId,
  basePath,
}: ActiveTasksAccordionProps) {
  const router = useRouter();
  const allTasks = useQuery(api.agentTasks.getActiveTasks, { repoId });
  const tasks = allTasks?.filter((t) => t.status === "in_progress") ?? [];

  const getTaskLink = (task: NonNullable<typeof allTasks>[number]) => {
    if (task.projectId) {
      return `${basePath}/projects/${task.projectId}`;
    }
    return `${basePath}/quick-tasks`;
  };

  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg bg-sidebar-accent/50 p-1.5">
      <Accordion
        type="multiple"
        defaultValue={["active-tasks"]}
        className="px-0"
      >
        <AccordionItem value="active-tasks" className="border-none px-0">
          <AccordionTrigger className="rounded-lg px-3 py-2 hover:bg-sidebar-accent/70 hover:no-underline">
            <div className="flex items-center gap-2">
              <IconListCheck size={16} className="text-primary" />
              <span className="text-sm font-medium text-foreground">
                Active Tasks
              </span>
              <span className="ml-auto rounded-full bg-sidebar-accent/50 px-1.5 py-0.5 text-xs text-muted-foreground">
                {tasks.length}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-0 pb-0">
            <div className="space-y-1 px-3">
              {tasks.map((task) => (
                <div
                  key={task._id}
                  onClick={() => router.push(getTaskLink(task))}
                  className="block rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/40"
                >
                  <div className="flex items-center justify-between rounded-lg p-2.5 transition-colors hover:bg-sidebar-accent/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">
                        {task.title}
                      </p>
                      {task.taskNumber && (
                        <p className="text-xs text-muted-foreground">
                          Task #{task.taskNumber}
                        </p>
                      )}
                    </div>
                    <TaskStatusBadge status={task.status} />
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
