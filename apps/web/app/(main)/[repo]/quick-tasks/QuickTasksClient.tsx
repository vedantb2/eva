"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useQueryState } from "nuqs";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { Button, Input, Spinner } from "@conductor/ui";
import { EmptyState } from "@/lib/components/ui/EmptyState";
import { QuickTaskModal } from "@/lib/components/quick-tasks/QuickTaskModal";
import { QuickTasksKanbanBoard } from "@/lib/components/quick-tasks/QuickTasksKanbanBoard";
import { GroupTasksModal } from "@/lib/components/quick-tasks/GroupTasksModal";
import { searchParser } from "@/lib/search-params";
import {
  IconChecklist,
  IconPlus,
  IconCheckbox,
  IconSearch,
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
  const [searchQuery, setSearchQuery] = useQueryState("q", searchParser);

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
        childPadding={false}
        headerCenter={
          hasQuickTasks ? (
            <div className="relative w-full max-w-lg">
              <IconSearch
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Search tasks..."
                className="h-8 pl-9 pr-8 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value || null)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery(null)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35"
                >
                  <IconX size={14} />
                </button>
              )}
            </div>
          ) : null
        }
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
        <div className="flex flex-1 min-h-0 flex-col overflow-hidden px-2 pb-2 pt-2">
          {tasks === undefined ? (
            <div className="flex flex-1 items-center justify-center">
              <Spinner />
            </div>
          ) : !hasQuickTasks ? (
            <EmptyState
              icon={
                <IconChecklist size={24} className="text-muted-foreground" />
              }
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
        </div>
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
