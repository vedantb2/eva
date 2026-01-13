"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/api";
import { GenericId as Id } from "convex/values";
import { TaskStatusBadge } from "./TaskStatusBadge";
import { SubtaskList } from "./SubtaskList";
import { IconGitBranch, IconPlayerPlay } from "@tabler/icons-react";
import { useState } from "react";

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
  const runs = useQuery(api.agentRuns.listByTask, { taskId });
  const startExecution = useMutation(api.agentTasks.startExecution);
  const [isStarting, setIsStarting] = useState(false);

  const hasActiveRun = runs?.some(
    (r) => r.status === "queued" || r.status === "running"
  );

  const handleStartExecution = async () => {
    setIsStarting(true);
    try {
      await startExecution({ id: taskId });
    } catch (err) {
      console.error("Failed to start execution:", err);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="sm:max-w-2xl"
      scrollBehavior="inside"
    >
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
        <ModalFooter>
          <Button
            color="primary"
            startContent={<IconPlayerPlay size={18} />}
            onPress={handleStartExecution}
            isLoading={isStarting}
            isDisabled={isBlocked || hasActiveRun || status === "done"}
          >
            {hasActiveRun ? "Running..." : "Run Agent"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
