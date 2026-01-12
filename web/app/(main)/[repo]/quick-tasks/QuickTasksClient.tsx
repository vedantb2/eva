"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/api";
import { useRepo } from "@/lib/contexts/RepoContext";
import { Container } from "@/lib/components/ui/Container";
import { PageHeader } from "@/lib/components/PageHeader";
import { Button } from "@/lib/components/ui/Button";
import { EmptyState } from "@/lib/components/ui/EmptyState";
import { QuickTaskModal } from "@/lib/components/quick-tasks/QuickTaskModal";
import { QuickTasksKanbanBoard } from "@/lib/components/quick-tasks/QuickTasksKanbanBoard";
import { IconChecklist, IconPlus } from "@tabler/icons-react";

export function QuickTasksClient() {
  const { repo } = useRepo();
  const tasks = useQuery(api.agentTasks.getAllTasks, { repoId: repo._id });
  const [isCreating, setIsCreating] = useState(false);

  const quickTasks = tasks?.filter((t) => !t.featureId) ?? [];
  const hasQuickTasks = quickTasks.length > 0;

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
        ) : !hasQuickTasks ? (
          <EmptyState
            icon={IconChecklist}
            title="No quick tasks"
            description="Quick tasks are standalone tasks not tied to a feature. Create one for small, one-off work."
            actionLabel="Create Quick Task"
            onAction={() => setIsCreating(true)}
          />
        ) : (
          <QuickTasksKanbanBoard repoId={repo._id} />
        )}
      </Container>
      <QuickTaskModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
      />
    </>
  );
}
