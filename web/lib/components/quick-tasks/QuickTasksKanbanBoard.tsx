"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/api";
import { GenericId as Id } from "convex/values";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import { KanbanBoard } from "@/lib/components/kanban/KanbanBoard";
import { QuickTaskCard } from "./QuickTaskCard";
import { TaskDetailModal } from "@/lib/components/tasks/TaskDetailModal";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { IconPlayerPlay } from "@tabler/icons-react";
import { SendToSessionModal } from "./SendToSessionModal";

type Task = FunctionReturnType<typeof api.agentTasks.getAllTasks>[number];
type TaskStatus = Task["status"];

interface QuickTasksKanbanBoardProps {
  repoId: Id<"githubRepos">;
  selectionMode: boolean;
  onExitSelection: () => void;
}

export function QuickTasksKanbanBoard({ repoId, selectionMode, onExitSelection }: QuickTasksKanbanBoardProps) {
  const allTasks = useQuery(api.agentTasks.getAllTasks, { repoId });
  const currentUserId = useQuery(api.auth.me);
  const updateStatus = useMutation(api.agentTasks.updateStatus);
  const startExecution = useMutation(api.agentTasks.startExecution);
  const [selectedTaskId, setSelectedTaskId] = useState<Id<"agentTasks"> | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<Id<"agentTasks">>>(new Set());
  const [showSendModal, setShowSendModal] = useState(false);
  const [isFixingAll, setIsFixingAll] = useState(false);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const toggleTaskSelection = (taskId: Id<"agentTasks">) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const tasks = (allTasks?.filter((t) => !t.projectId) ?? []).sort(
    (a, b) => b.updatedAt - a.updatedAt,
  );

  if (allTasks === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return null;
  }

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    await updateStatus({ id: id as Id<"agentTasks">, status });
  };

  const todoTasks = tasks.filter((t) => t.status === "todo");
  const ownedTodoTasks = todoTasks.filter(
    (t) => t.createdBy === currentUserId,
  );
  const skippedCount = todoTasks.length - ownedTodoTasks.length;

  const handleFixAll = async () => {
    if (ownedTodoTasks.length === 0) return;
    setIsFixingAll(true);
    try {
      for (const task of ownedTodoTasks) {
        const result = await startExecution({ id: task._id });
        await fetch("/api/inngest/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "task/execute.requested",
            data: {
              runId: result.runId,
              taskId: result.taskId,
              repoId: result.repoId,
              installationId: result.installationId,
              projectId: result.projectId,
              branchName: result.branchName,
              isFirstTaskOnBranch: result.isFirstTaskOnBranch,
            },
          }),
        });
      }
    } catch (err) {
      console.error("Failed to fix all:", err);
    } finally {
      setIsFixingAll(false);
    }
  };

  return (
    <>
      <KanbanBoard
        items={tasks}
        onStatusChange={handleStatusChange}
        onItemClick={(task) => {
          if (selectionMode) {
            toggleTaskSelection(task._id);
          } else {
            setSelectedTaskId(task._id);
          }
        }}
        fillHeight
        columnExtra={(status) =>
          status === "todo" && todoTasks.length > 0 ? (
            <Button
              size="sm"
              variant="flat"
              color="primary"
              startContent={<IconPlayerPlay size={14} />}
              onPress={onOpen}
              isLoading={isFixingAll}
            >
              Fix All
            </Button>
          ) : null
        }
        renderCard={(task) => (
          <QuickTaskCard
            id={task._id}
            title={task.title}
            description={task.description}
            status={task.status}
            createdAt={task.createdAt}
            createdBy={task.createdBy}
            isSelected={selectedTaskIds.has(task._id)}
          />
        )}
        renderOverlay={(task) => (
          <Card shadow="none" className="w-[240px] sm:w-[280px]">
            <CardBody className="p-3">
              <span className="font-medium text-sm">{task.title}</span>
            </CardBody>
          </Card>
        )}
      />
      <Modal backdrop="blur" isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Complete All Tasks</ModalHeader>
              <ModalBody className="text-sm text-default-600 space-y-2">
                {ownedTodoTasks.length > 0 ? (
                  <>
                    <p>
                      Eva will run and complete {ownedTodoTasks.length} task
                      {ownedTodoTasks.length !== 1 && "s"} you created.
                    </p>
                    {skippedCount > 0 && (
                      <p className="text-warning-600 dark:text-warning-400">
                        {skippedCount} task{skippedCount !== 1 && "s"} created
                        by others will be skipped. Only the task owner can run
                        Eva.
                      </p>
                    )}
                    <p>
                      If there is an issue, Eva will return the task to To Do
                      with a red border.
                    </p>
                    <p>If successful, she will move it to Code Review.</p>
                  </>
                ) : (
                  <p>
                    Only the task owner can run Eva. None of the todo tasks were
                    created by you.
                  </p>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  isDisabled={ownedTodoTasks.length === 0}
                  onPress={() => {
                    onClose();
                    handleFixAll();
                  }}
                >
                  Complete All
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      {selectedTaskId && (
        <TaskDetailModal
          isOpen={!!selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          taskId={selectedTaskId}
        />
      )}
      {selectionMode && selectedTaskIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-default-100 border border-default-300 rounded-xl px-4 py-3 shadow-lg">
          <span className="text-sm font-medium">{selectedTaskIds.size} selected</span>
          <Button size="sm" color="primary" onPress={() => setShowSendModal(true)}>
            Send to Session
          </Button>
          <Button
            size="sm"
            variant="flat"
            onPress={() => {
              setSelectedTaskIds(new Set());
              onExitSelection();
            }}
          >
            Cancel
          </Button>
        </div>
      )}
      <SendToSessionModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        taskIds={Array.from(selectedTaskIds)}
        repoId={repoId}
        onDone={() => {
          setSelectedTaskIds(new Set());
          setShowSendModal(false);
          onExitSelection();
        }}
      />
    </>
  );
}
