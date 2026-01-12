"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/api";
import { useRepo } from "@/lib/contexts/RepoContext";
import { Container } from "@/lib/components/ui/Container";
import { PageHeader } from "@/lib/components/PageHeader";
import { Button } from "@/lib/components/ui/Button";
import { EmptyState } from "@/lib/components/ui/EmptyState";
import { TaskStatusBadge } from "@/lib/components/tasks/TaskStatusBadge";
import { QuickTaskModal } from "@/lib/components/quick-tasks/QuickTaskModal";
import { IconChecklist, IconPlus } from "@tabler/icons-react";

export function QuickTasksClient() {
  const { repo } = useRepo();
  const tasks = useQuery(api.agentTasks.getActiveTasks, { repoId: repo._id });
  const [isCreating, setIsCreating] = useState(false);

  const quickTasks = tasks?.filter((t) => !t.featureId) ?? [];

  return (
    <>
      <PageHeader
        title="Quick Tasks"
        headerRight={
          <Button onClick={() => setIsCreating(true)}>
            <IconPlus size={16} className="mr-1" />
            New Task
          </Button>
        }
      />
      <Container>
        {tasks === undefined ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600" />
          </div>
        ) : quickTasks.length === 0 ? (
          <EmptyState
            icon={IconChecklist}
            title="No quick tasks"
            description="Quick tasks are standalone tasks not tied to a feature. Create one for small, one-off work."
            actionLabel="Create Quick Task"
            onAction={() => setIsCreating(true)}
          />
        ) : (
          <div className="space-y-3">
            {quickTasks.map((task) => (
              <div
                key={task._id}
                className="p-4 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:border-pink-300 dark:hover:border-pink-700 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-medium text-neutral-900 dark:text-white">
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>
                  <TaskStatusBadge status={task.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>
      <QuickTaskModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
      />
    </>
  );
}
