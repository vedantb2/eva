"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useQueryState } from "nuqs";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { Button, SearchInput, Spinner } from "@conductor/ui";
import { EmptyState } from "@/lib/components/ui/EmptyState";
import { QuickTaskModal } from "@/lib/components/quick-tasks/QuickTaskModal";
import { QuickTasksKanbanBoard } from "@/lib/components/quick-tasks/QuickTasksKanbanBoard";
import { GroupTasksModal } from "@/lib/components/quick-tasks/GroupTasksModal";
import { searchParser } from "@/lib/search-params";
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
            <SearchInput
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(v) => setSearchQuery(v || null)}
              onClear={() => setSearchQuery(null)}
              className="animate-in fade-in duration-300"
            />
          ) : null
        }
        headerRight={
          <div className="flex items-center gap-2">
            <AnimatePresence initial={false} mode="popLayout">
              {hasQuickTasks &&
                (isSelecting ? (
                  <motion.div
                    key="quick-task-selecting-actions"
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                  >
                    <Button
                      size="sm"
                      variant="secondary"
                      className="motion-press hover:scale-[1.01] active:scale-[0.99]"
                      onClick={exitSelectMode}
                    >
                      <IconX size={16} />
                      Cancel
                    </Button>
                    <AnimatePresence initial={false}>
                      {selectedIds.size > 0 && (
                        <motion.div
                          key="quick-task-group-action"
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.18 }}
                        >
                          <Button
                            size="sm"
                            className="motion-press hover:scale-[1.01] active:scale-[0.99]"
                            onClick={() => setIsGroupModalOpen(true)}
                          >
                            <IconFolders size={16} />
                            Group {selectedIds.size} into Project
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <motion.div
                    key="quick-task-select-action"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                  >
                    <Button
                      size="sm"
                      variant="secondary"
                      className="motion-press hover:scale-[1.01] active:scale-[0.99]"
                      onClick={() => setIsSelecting(true)}
                    >
                      <IconCheckbox size={16} />
                      Select
                    </Button>
                  </motion.div>
                ))}
            </AnimatePresence>
            <Button
              size="sm"
              className="motion-press hover:scale-[1.01] active:scale-[0.99]"
              onClick={() => setIsCreating(true)}
            >
              <IconPlus size={16} />
              New Task
            </Button>
          </div>
        }
      >
        <div className="flex flex-1 min-h-0 flex-col overflow-hidden px-2 pb-2 pt-2">
          <AnimatePresence mode="wait">
            {tasks === undefined ? (
              <motion.div
                key="quick-tasks-loading"
                className="flex flex-1 items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Spinner />
              </motion.div>
            ) : !hasQuickTasks ? (
              <motion.div
                key="quick-tasks-empty"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
              >
                <EmptyState
                  icon={
                    <IconChecklist
                      size={24}
                      className="text-muted-foreground"
                    />
                  }
                  title="No quick tasks"
                  description="Quick tasks are standalone tasks not tied to a feature. Create one for small, one-off work."
                  actionLabel="Create Quick Task"
                  onAction={() => setIsCreating(true)}
                />
              </motion.div>
            ) : (
              <motion.div
                key="quick-tasks-board"
                className="flex flex-1 min-h-0"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
              >
                <QuickTasksKanbanBoard
                  repoId={repo._id}
                  isSelecting={isSelecting}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                />
              </motion.div>
            )}
          </AnimatePresence>
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
