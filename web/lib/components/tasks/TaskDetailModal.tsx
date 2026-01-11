"use client";

import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/react";
import { GenericId as Id } from "convex/values";
import { useQuery } from "convex/react";
import { api } from "@/api";
import { AgentStatusBadge } from "@/lib/components/agent/AgentStatusBadge";
import { SubtaskList } from "./SubtaskList";
import { CommentThread } from "./CommentThread";
import { IconGitBranch } from "@tabler/icons-react";

type AgentStatus =
  | "idle"
  | "queued"
  | "running"
  | "reviewing"
  | "completed"
  | "failed";

interface AgentTask {
  _id: Id<"agentTasks">;
  boardId: Id<"boards">;
  columnId: Id<"columns">;
  title: string;
  description?: string;
  branchName?: string;
  status: AgentStatus;
  order: number;
}

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: AgentTask;
}

export function TaskDetailModal({
  isOpen,
  onClose,
  task,
}: TaskDetailModalProps) {
  const taskData = useQuery(api.agentTasks.get, { id: task._id });

  const currentTask = taskData ?? task;

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      size="2xl"
      placement="center"
      scrollBehavior="inside"
      classNames={{ backdrop: "bg-black/50" }}
    >
      <ModalContent className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 max-h-[85vh]">
        <ModalHeader className="flex flex-col gap-1 pb-0 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-start justify-between">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
              {currentTask.title}
            </h2>
            <AgentStatusBadge status={currentTask.status} />
          </div>
          {currentTask.branchName && (
            <div className="flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400">
              <IconGitBranch size={14} />
              <code className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 rounded text-xs">
                {currentTask.branchName}
              </code>
            </div>
          )}
        </ModalHeader>
        <ModalBody className="py-4 space-y-6">
          {currentTask.description && (
            <div>
              <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Description
              </h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">
                {currentTask.description}
              </p>
            </div>
          )}

          <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
            <SubtaskList taskId={task._id} />
          </div>

          <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
            <CommentThread taskId={task._id} />
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
