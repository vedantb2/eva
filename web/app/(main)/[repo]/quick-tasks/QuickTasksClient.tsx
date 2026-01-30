"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/api";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { Button } from "@heroui/button";
import { EmptyState } from "@/lib/components/ui/EmptyState";
import { QuickTaskModal } from "@/lib/components/quick-tasks/QuickTaskModal";
import { QuickTasksKanbanBoard } from "@/lib/components/quick-tasks/QuickTasksKanbanBoard";
import { IconChecklist, IconPlus, IconSelect } from "@tabler/icons-react";

export function QuickTasksClient() {
  const { repo } = useRepo();
  const tasks = useQuery(api.agentTasks.getAllTasks, { repoId: repo._id });
  const [isCreating, setIsCreating] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);

  const quickTasks = tasks?.filter((t) => !t.projectId) ?? [];
  const hasQuickTasks = quickTasks.length > 0;

  return (
    <>
      <PageWrapper
        title="Quick Tasks"
        fillHeight
        headerRight={
          <div className="flex items-center gap-2">
            {hasQuickTasks && (
              <Button
                variant={selectionMode ? "solid" : "flat"}
                color={selectionMode ? "primary" : "default"}
                startContent={<IconSelect size={16} />}
                onPress={() => setSelectionMode(!selectionMode)}
              >
                {selectionMode ? "Selecting" : "Select"}
              </Button>
            )}
            <Button
              color="primary"
              startContent={<IconPlus size={16} />}
              onPress={() => setIsCreating(true)}
            >
              New Task
            </Button>
          </div>
        }
      >
        {tasks === undefined ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
          </div>
        ) : !hasQuickTasks ? (
          <EmptyState
            icon={IconChecklist}
            title="No quick tasks"
            description="Quick tasks are standalone tasks not tied to a feature. Create one for small, one-off work."
            actionLabel="Create Quick Task"
            onAction={() => setIsCreating(true)}
          />
        ) : (
          <QuickTasksKanbanBoard
            repoId={repo._id}
            selectionMode={selectionMode}
            onExitSelection={() => setSelectionMode(false)}
          />
        )}
      </PageWrapper>
      <QuickTaskModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
      />
    </>
  );
}
