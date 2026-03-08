"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import {
  Badge,
  Button,
  Spinner,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
  ActivitySteps,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@conductor/ui";
import {
  statusConfig,
  type TaskStatus,
} from "@/lib/components/tasks/TaskStatusBadge";
import { SubtaskList } from "@/lib/components/tasks/SubtaskList";
import { TaskDetailModal } from "@/lib/components/tasks/TaskDetailModal";
import {
  IconTerminal2,
  IconGitPullRequest,
  IconExternalLink,
  IconMessageCircle,
  IconCircleCheck,
  IconCircleX,
  IconClock,
} from "@tabler/icons-react";
import dayjs from "@conductor/shared/dates";
import { parseActivitySteps } from "@/lib/utils/parseActivitySteps";

import { formatDuration } from "@/lib/utils/formatDuration";
import { RunActivityLog } from "@/lib/components/tasks/RunActivityLog";

interface ProjectTaskDetailPanelProps {
  taskId: Id<"agentTasks">;
  onOpenChat: () => void;
}

export function ProjectTaskDetailPanel({
  taskId,
  onOpenChat,
}: ProjectTaskDetailPanelProps) {
  const task = useQuery(api.agentTasks.get, { id: taskId });
  const runs = useQuery(api.agentRuns.listByTask, { taskId });
  const subtasks = useQuery(api.subtasks.listByTask, { parentTaskId: taskId });
  const activeRun = runs?.find((run) => run.status === "running");
  const streaming = useQuery(
    api.streaming.get,
    activeRun ? { entityId: `task-run-${activeRun._id}` } : "skip",
  );
  const [showModal, setShowModal] = useState(false);

  if (!task) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner />
      </div>
    );
  }

  const config = statusConfig[task.status as TaskStatus];
  const StatusIcon = config.icon;
  const latestPrUrl = runs?.find((r) => r.prUrl)?.prUrl;

  return (
    <>
      <div className="flex flex-col h-full overflow-y-auto scrollbar">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-muted-foreground font-mono text-sm flex-shrink-0">
              #{task.taskNumber}
            </span>
            <h2 className="font-semibold text-sm truncate">{task.title}</h2>
            <Badge
              variant="outline"
              className={`${config.bg} ${config.text} gap-1 flex-shrink-0`}
            >
              <StatusIcon size={12} />
              {config.label}
            </Badge>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {latestPrUrl && (
              <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
                <a href={latestPrUrl} target="_blank" rel="noopener noreferrer">
                  <IconGitPullRequest size={14} className="text-success" />
                </a>
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => setShowModal(true)}
              title="Open full details"
            >
              <IconExternalLink size={14} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={onOpenChat}
              title="Open chat"
            >
              <IconMessageCircle size={14} />
            </Button>
          </div>
        </div>
        <div className="p-4 space-y-4 flex-1">
          {task.description && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-1">
                Description
              </h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {task.description.includes("---")
                  ? task.description
                      .slice(0, task.description.indexOf("---"))
                      .trimEnd()
                  : task.description}
              </p>
            </div>
          )}
          {subtasks && subtasks.length > 0 && (
            <div className="pt-4">
              <SubtaskList taskId={taskId} readOnly={task.status !== "todo"} />
            </div>
          )}
          {runs && runs.length > 0 && (
            <div className="pt-4">
              <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                <IconTerminal2 size={14} />
                Agent Runs ({runs.length})
              </h4>
              <Accordion
                type="multiple"
                defaultValue={runs
                  .filter(
                    (run) =>
                      run.status === "running" ||
                      run.status === "queued" ||
                      run.status === "error",
                  )
                  .map((run) => run._id)}
                className="space-y-2"
              >
                {runs.map((run) => (
                  <AccordionItem
                    key={run._id}
                    value={run._id}
                    className="border rounded-lg px-3"
                  >
                    <AccordionTrigger>
                      <div className="flex flex-1 items-center justify-between mr-2">
                        <div className="flex items-center gap-2">
                          {run.status === "success" ? (
                            <IconCircleCheck
                              size={16}
                              className="text-success"
                            />
                          ) : run.status === "error" ? (
                            <IconCircleX
                              size={16}
                              className="text-destructive"
                            />
                          ) : run.status === "running" ? (
                            <Spinner size="sm" />
                          ) : (
                            <IconClock
                              size={16}
                              className="text-muted-foreground"
                            />
                          )}
                          <span className="text-xs text-muted-foreground">
                            {run.startedAt
                              ? dayjs(run.startedAt).format(
                                  "M/D/YYYY, h:mm:ss A",
                                )
                              : "Queued"}
                          </span>
                        </div>
                        {run.startedAt && run.finishedAt && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-xs text-muted-foreground">
                                {formatDuration(run.startedAt, run.finishedAt)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              Completed{" "}
                              {dayjs(run.finishedAt).format(
                                "M/D/YYYY, h:mm:ss A",
                              )}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {run.status === "running" &&
                          streaming?.currentActivity &&
                          (() => {
                            const steps = parseActivitySteps(
                              streaming.currentActivity,
                            );
                            return steps ? (
                              <ActivitySteps steps={steps} isStreaming />
                            ) : (
                              <Reasoning isStreaming defaultOpen>
                                <ReasoningTrigger
                                  getThinkingMessage={(s) =>
                                    s ? "Working..." : "Processing complete"
                                  }
                                />
                                <ReasoningContent>
                                  {streaming.currentActivity}
                                </ReasoningContent>
                              </Reasoning>
                            );
                          })()}
                        <RunActivityLog runId={run._id} />
                        {run.resultSummary && (
                          <p className="text-sm text-muted-foreground">
                            {run.resultSummary}
                          </p>
                        )}
                        {run.error && (
                          <div className="p-2 bg-destructive/10 rounded text-sm text-destructive">
                            {run.error}
                          </div>
                        )}
                        {run.logs.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground mb-1">
                              Logs
                            </p>
                            <div className="bg-muted rounded p-2 max-h-60 overflow-y-auto scrollbar font-mono text-xs space-y-1">
                              {run.logs.map((log, i) => (
                                <div
                                  key={i}
                                  className={`flex gap-2 ${
                                    log.level === "error"
                                      ? "text-destructive"
                                      : log.level === "warn"
                                        ? "text-warning"
                                        : "text-muted-foreground"
                                  }`}
                                >
                                  <span className="text-muted-foreground flex-shrink-0">
                                    {dayjs(log.timestamp).format("h:mm:ss A")}
                                  </span>
                                  <span className="break-all">
                                    {log.message}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </div>
      </div>
      {showModal && (
        <TaskDetailModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          taskId={taskId}
        />
      )}
    </>
  );
}
