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
import { IconGitBranch, IconPlayerPlay, IconTerminal2 } from "@tabler/icons-react";
import { useState } from "react";
import { Accordion, AccordionItem } from "@heroui/accordion";

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
      const result = await startExecution({ id: taskId });
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
          },
        }),
      });
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

            {runs && runs.length > 0 && (
              <div className="border-t border-divider pt-4">
                <h4 className="text-sm font-medium text-default-700 mb-3 flex items-center gap-2">
                  <IconTerminal2 size={16} />
                  Agent Runs ({runs.length})
                </h4>
                <Accordion variant="splitted" selectionMode="multiple">
                  {runs.map((run) => (
                    <AccordionItem
                      key={run._id}
                      title={
                        <div className="flex items-center gap-2">
                          <Chip
                            size="sm"
                            color={
                              run.status === "success"
                                ? "success"
                                : run.status === "error"
                                  ? "danger"
                                  : run.status === "running"
                                    ? "warning"
                                    : "default"
                            }
                            variant="flat"
                          >
                            {run.status}
                          </Chip>
                          <span className="text-xs text-default-400">
                            {run.startedAt
                              ? new Date(run.startedAt).toLocaleString()
                              : "Queued"}
                          </span>
                        </div>
                      }
                    >
                      <div className="space-y-2">
                        {run.resultSummary && (
                          <p className="text-sm text-default-600">{run.resultSummary}</p>
                        )}
                        {run.error && (
                          <div className="p-2 bg-danger-50 dark:bg-danger-900/20 rounded text-sm text-danger-600 dark:text-danger-400">
                            {run.error}
                          </div>
                        )}
                        {run.prUrl && (
                          <a
                            href={run.prUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary-500 hover:underline"
                          >
                            View Pull Request
                          </a>
                        )}
                        {run.logs.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-default-400 mb-1">Logs</p>
                            <div className="bg-default-100 rounded p-2 max-h-60 overflow-y-auto font-mono text-xs space-y-1">
                              {run.logs.map((log, i) => (
                                <div
                                  key={i}
                                  className={`flex gap-2 ${
                                    log.level === "error"
                                      ? "text-danger-500"
                                      : log.level === "warn"
                                        ? "text-warning-500"
                                        : "text-default-600"
                                  }`}
                                >
                                  <span className="text-default-400 flex-shrink-0">
                                    {new Date(log.timestamp).toLocaleTimeString()}
                                  </span>
                                  <span className="break-all">{log.message}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}
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
