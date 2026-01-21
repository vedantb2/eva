"use client";

import { Accordion, AccordionItem } from "@heroui/react";
import { useQuery } from "convex/react";
import { api } from "@/api";
import { TaskStatusBadge } from "@/lib/components/tasks/TaskStatusBadge";
import { IconListCheck } from "@tabler/icons-react";
import { GenericId as Id } from "convex/values";
import Link from "next/link";

interface ActiveTasksAccordionProps {
  repoId?: Id<"githubRepos">;
  repoSlug: string;
}

export function ActiveTasksAccordion({ repoId, repoSlug }: ActiveTasksAccordionProps) {
  const allTasks = useQuery(api.agentTasks.getActiveTasks, { repoId });
  const tasks = allTasks?.filter((t) => t.status === "in_progress") ?? [];

  const getTaskLink = (task: NonNullable<typeof allTasks>[number]) => {
    if (task.featureId) {
      return `/${repoSlug}/features/${task.featureId}`;
    }
    return `/${repoSlug}/quick-tasks`;
  };

  if (tasks.length === 0) {
    return null;
  }

  return (
    <Accordion
      selectionMode="multiple"
      defaultExpandedKeys={["active-tasks"]}
      className="px-0"
    >
      <AccordionItem
        key="active-tasks"
        aria-label="Active Tasks"
        title={
          <div className="flex items-center gap-2">
            <IconListCheck className="w-4 h-4 text-pink-600" />
            <span className="text-sm font-medium">Active Tasks</span>
            <span className="ml-auto text-xs text-neutral-500 bg-neutral-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded">
              {tasks.length}
            </span>
          </div>
        }
        classNames={{
          base: "px-0",
          trigger:
            "px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg",
          content: "px-0",
        }}
      >
        <div className="space-y-1 px-3">
          {tasks.map((task) => (
            <Link key={task._id} href={getTaskLink(task)}>
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-900 dark:text-white truncate">
                    {task.title}
                  </p>
                  {task.taskNumber && (
                    <p className="text-xs text-neutral-500">
                      Task #{task.taskNumber}
                    </p>
                  )}
                </div>
                <TaskStatusBadge status={task.status} size="sm" />
              </div>
            </Link>
          ))}
        </div>
      </AccordionItem>
    </Accordion>
  );
}
