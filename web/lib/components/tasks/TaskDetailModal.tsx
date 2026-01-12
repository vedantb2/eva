"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
} from "@heroui/modal";
import { Chip } from "@heroui/chip";
import { useQuery } from "convex/react";
import { api } from "@/api";
import { GenericId as Id } from "convex/values";
import { TaskStatusBadge } from "./TaskStatusBadge";
import { SubtaskList } from "./SubtaskList";
import { IconGitBranch } from "@tabler/icons-react";

type TaskStatus =
  | "archived"
  | "backlog"
  | "todo"
  | "in_progress"
  | "code_review"
  | "done";

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: Id<"agentTasks">;
  taskNumber?: number;
  title: string;
  description?: string;
  status: TaskStatus;
  branchName?: string;
}

export function TaskDetailModal({
  isOpen,
  onClose,
  taskId,
  taskNumber,
  title,
  description,
  status,
  branchName,
}: TaskDetailModalProps) {
  const isBlocked = useQuery(api.taskDependencies.isBlocked, { taskId });

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full" className="sm:max-w-2xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            {taskNumber && (
              <span className="text-default-400 font-mono">#{taskNumber}</span>
            )}
            <span>{title}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <TaskStatusBadge status={status} />
            {isBlocked && (
              <Chip size="sm" color="warning" variant="flat">
                Blocked
              </Chip>
            )}
          </div>
        </ModalHeader>
        <ModalBody className="pb-6">
          <div className="space-y-6">
            {description && (
              <div>
                <h4 className="text-sm font-medium text-default-700 mb-2">
                  Description
                </h4>
                <p className="text-sm text-default-600 whitespace-pre-wrap">
                  {description}
                </p>
              </div>
            )}

            {branchName && (
              <div>
                <h4 className="text-sm font-medium text-default-700 mb-2">
                  Branch
                </h4>
                <div className="flex items-center gap-2 text-sm text-default-500">
                  <IconGitBranch size={16} />
                  <code className="bg-default-100 px-2 py-1 rounded text-xs sm:text-sm break-all">
                    {branchName}
                  </code>
                </div>
              </div>
            )}


            <div className="border-t border-divider pt-4">
              <SubtaskList taskId={taskId} />
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
