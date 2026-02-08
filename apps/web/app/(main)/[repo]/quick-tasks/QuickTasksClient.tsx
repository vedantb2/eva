"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { Button } from "@conductor/ui";
import { Skeleton } from "@/lib/components/ui/Skeleton";
import { EmptyState } from "@/lib/components/ui/EmptyState";
import { QuickTaskModal } from "@/lib/components/quick-tasks/QuickTaskModal";
import { QuickTasksKanbanBoard } from "@/lib/components/quick-tasks/QuickTasksKanbanBoard";
import { GroupTasksModal } from "@/lib/components/quick-tasks/GroupTasksModal";
import {
  IconChecklist,
  IconPlus,
  IconCheckbox,
  IconX,
  IconFolders,
} from "@tabler/icons-react";

export function QuickTasksClient() {
  const { repo } = useRepo();
  const tasks = useQuery(api.agentTasks.getAllTasks, { repoId: repo._id });
  const [isCreating, setIsCreating] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<Id<"agentTasks">>>(
    new Set(),
  );
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  const quickTasks = tasks?.filter((t) => !t.projectId) ?? [];
  const hasQuickTasks = quickTasks.length > 0;

  const toggleSelect = (id: Id<"agentTasks">) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const exitSelectMode = () => {
    setIsSelecting(false);
    setSelectedIds(new Set());
  };

  return (
    <>
      <PageWrapper
        title="Quick Tasks"
        fillHeight
        headerRight={
          <div className="flex items-center gap-2">
            {hasQuickTasks &&
              (isSelecting ? (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={exitSelectMode}
                  >
                    <IconX size={16} />
                    Cancel
                  </Button>
                  {selectedIds.size > 0 && (
                    <Button size="sm" onClick={() => setIsGroupModalOpen(true)}>
                      <IconFolders size={16} />
                      Group {selectedIds.size} into Project
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setIsSelecting(true)}
                >
                  <IconCheckbox size={16} />
                  Select
                </Button>
              ))}
            <Button size="sm" onClick={() => setIsCreating(true)}>
              <IconPlus size={16} />
              New Task
            </Button>
          </div>
        }
      >
        {tasks === undefined ? (
          <div className="flex items-stretch gap-2 flex-1 min-h-0">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex-1 min-w-0 bg-secondary rounded-md p-2 space-y-2"
              >
                <Skeleton className="h-6 w-24" />
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-20 rounded-md" />
                ))}
              </div>
            ))}
          </div>
        ) : !hasQuickTasks ? (
          <EmptyState
            icon={<IconChecklist size={24} className="text-muted-foreground" />}
            title="No quick tasks"
            description="Quick tasks are standalone tasks not tied to a feature. Create one for small, one-off work."
            actionLabel="Create Quick Task"
            onAction={() => setIsCreating(true)}
          />
        ) : (
          <QuickTasksKanbanBoard
            repoId={repo._id}
            isSelecting={isSelecting}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
          />
        )}
      </PageWrapper>
      <QuickTaskModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
      />
      <GroupTasksModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        selectedTaskIds={selectedIds}
        onSuccess={exitSelectMode}
      />
    </>
  );
}
