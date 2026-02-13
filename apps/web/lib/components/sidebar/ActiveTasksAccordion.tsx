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
import Link from "next/link";

interface ActiveTasksAccordionProps {
  repoId?: Id<"githubRepos">;
  repoSlug: string;
}

export function ActiveTasksAccordion({
  repoId,
  repoSlug,
}: ActiveTasksAccordionProps) {
  const allTasks = useQuery(api.agentTasks.getActiveTasks, { repoId });
  const tasks = allTasks?.filter((t) => t.status === "in_progress") ?? [];

  const getTaskLink = (task: NonNullable<typeof allTasks>[number]) => {
    if (task.projectId) {
      return `/${repoSlug}/projects/${task.projectId}`;
    }
    return `/${repoSlug}/quick-tasks`;
  };

  if (tasks.length === 0) {
    return null;
  }

  return (
    <Accordion type="multiple" defaultValue={["active-tasks"]} className="px-0">
      <AccordionItem value="active-tasks" className="border-b-0 px-0">
        <AccordionTrigger className="px-2.5 py-1.5 hover:bg-muted/50 rounded-md hover:no-underline">
          <div className="flex items-center gap-2">
            <IconListCheck size={16} className="text-primary" />
            <span className="text-sm font-medium text-foreground">
              Active Tasks
            </span>
            <span className="ml-auto text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
              {tasks.length}
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-0 pb-0">
          <div className="space-y-0.5 px-3">
            {tasks.map((task) => (
              <Link key={task._id} href={getTaskLink(task)}>
                <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors duration-150 cursor-pointer">
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
              </Link>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
