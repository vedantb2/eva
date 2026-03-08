"use client";

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  Input,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  Badge,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
  ActivitySteps,
  Spinner,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@conductor/ui";
import { useMutation, useQuery } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { CLAUDE_MODELS } from "@conductor/backend";
import {
  statusConfig,
  TASK_STATUSES,
  type TaskStatus,
} from "./TaskStatusBadge";
import { SubtaskList } from "./SubtaskList";
import {
  IconPlayerPlay,
  IconTerminal2,
  IconTrash,
  IconGitPullRequest,
  IconArrowUp,
  IconMessagePlus,
  IconX,
  IconPhoto,
  IconLoader2,
  IconShieldCheck,
  IconCheck,
  IconAlertTriangle,
  IconCircleDot,
  IconUserPlus,
  IconBrain,
  IconFolder,
  IconTags,
  IconGitBranch,
  IconInfoCircle,
  IconPlayerStop,
  IconClock,
  IconCircleCheck,
  IconCircleX,
  IconBrandVercel,
  IconDots,
  IconEdit,
  IconMessageCircle,
} from "@tabler/icons-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import dayjs from "@conductor/shared/dates";
import { parseActivitySteps } from "@/lib/utils/parseActivitySteps";
import { formatDuration } from "@/lib/utils/formatDuration";
import { BranchSelect } from "@/lib/components/BranchSelect";
import { ProofCarousel } from "./ProofCarousel";
import { SchedulePopover } from "./SchedulePopover";
import { RunActivityLog } from "./RunActivityLog";

const NO_PROJECT_VALUE = "__none__";

export function useTaskDetail(taskId: Id<"agentTasks">, onClose: () => void) {
  const task = useQuery(api.agentTasks.get, { id: taskId });
  const currentUserId = useQuery(api.auth.me);
  const isOwner = currentUserId === task?.createdBy;
  const isBlocked = useQuery(api.taskDependencies.isBlocked, { taskId });
  const runs = useQuery(api.agentRuns.listByTask, { taskId });
  const hasActiveRun = runs?.some(
    (run) => run.status === "queued" || run.status === "running",
  );
  const activeRun = runs?.find((run) => run.status === "running");
  const streaming = useQuery(
    api.streaming.get,
    activeRun ? { entityId: `task-run-${activeRun._id}` } : "skip",
  );
  const audit = useQuery(api.taskAudits.getByTask, { taskId });
  const auditStreaming = useQuery(
    api.streaming.get,
    audit?.status === "running"
      ? { entityId: `task-audit-run-${audit.runId}` }
      : "skip",
  );
  const dependentTasks = useQuery(api.agentTasks.getDependentTasks, { taskId });
  const users = useQuery(api.users.listAll);
  const projects = useQuery(
    api.projects.list,
    task?.repoId ? { repoId: task.repoId } : "skip",
  );
  const startExecution = useMutation(api.agentTasks.startExecution);
  const cancelExecution = useMutation(api.taskWorkflow.cancelExecution);
  const updateTask = useMutation(api.agentTasks.update);
  const updateStatus = useMutation(api.agentTasks.updateStatus);
  const deleteTask = useMutation(api.agentTasks.deleteCascade);
  const allComments = useQuery(api.taskComments.listByTask, { taskId });
  const comments = allComments?.filter((c) => c.authorId);
  const createComment = useMutation(api.taskComments.create);
  const removeComment = useMutation(api.taskComments.remove);
  const subtasks = useQuery(api.subtasks.listByTask, { parentTaskId: taskId });
  const proofs = useQuery(api.taskProof.listByTask, { taskId });
  const [baseBranch, setBaseBranch] = useState("main");
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [requestChangesPanel, setRequestChangesPanel] = useState(false);
  const [tagsInput, setTagsInput] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editDescription, setEditDescription] = useState("");
  const [viewingCommentForRun, setViewingCommentForRun] = useState<
    string | null
  >(null);
  const descriptionEditorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTagsInput((task?.tags ?? []).join(", "));
  }, [task?.tags]);

  useEffect(() => {
    setBaseBranch(task?.baseBranch ?? "main");
  }, [task?.baseBranch]);

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault();
    const text = commentText.trim();
    if (!text) return;
    setCommentText("");
    await createComment({ taskId, content: text });

    if (requestChangesPanel) {
      setRequestChangesPanel(false);
      try {
        await startExecution({ id: taskId });
      } catch (err) {
        console.error("Failed to start execution for change request:", err);
      }
    }
  };

  const latestPrUrl = runs?.find((r) => r.prUrl)?.prUrl;
  const latestDeployment = runs?.find((r) => r.deploymentStatus);
  const status = task?.status;
  const showProofSection =
    status !== undefined && status !== "todo" && status !== "in_progress";
  const projectOptions = projects ?? [];
  const hasSelectedProject =
    task?.projectId !== undefined &&
    projectOptions.some((project) => project._id === task.projectId);
  const selectedProjectValue = task?.projectId ?? NO_PROJECT_VALUE;
  const canEditTaskText = status === "todo" && !hasActiveRun;

  const sortedRuns = [...(runs ?? [])].sort(
    (a, b) =>
      (a.startedAt ?? a._creationTime) - (b.startedAt ?? b._creationTime),
  );
  const firstRunId = sortedRuns.length > 0 ? sortedRuns[0]._id : null;

  const runCommentMap = new Map<string, NonNullable<typeof comments>[number]>();
  if (comments && runs) {
    const sortedComments = [...comments].sort(
      (a, b) => a.createdAt - b.createdAt,
    );
    for (const run of sortedRuns) {
      if (run._id === firstRunId) continue;
      const runTime = run._creationTime;
      let matchedComment: NonNullable<typeof comments>[number] | undefined;
      for (const comment of sortedComments) {
        if (comment.createdAt <= runTime) {
          matchedComment = comment;
        }
      }
      if (matchedComment) {
        runCommentMap.set(run._id, matchedComment);
      }
    }
  }

  const viewingComment = viewingCommentForRun
    ? runCommentMap.get(viewingCommentForRun)
    : undefined;

  useEffect(() => {
    if (canEditTaskText) return;
    setIsEditingTitle(false);
    setIsEditingDescription(false);
  }, [canEditTaskText]);

  useEffect(() => {
    if (!isEditingDescription) return;
    const editor = descriptionEditorRef.current;
    if (!editor || typeof window === "undefined") return;
    editor.innerText = editDescription;
    editor.focus();
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, [isEditingDescription]);

  const beginDescriptionEdit = (value: string) => {
    if (!canEditTaskText) return;
    setEditDescription(value);
    setIsEditingDescription(true);
  };

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

  const handleStopExecution = async () => {
    setIsStopping(true);
    try {
      await cancelExecution({ taskId });
    } catch (err) {
      console.error("Failed to stop execution:", err);
    } finally {
      setIsStopping(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTask({ id: taskId });
      setShowDeleteConfirm(false);
      onClose();
    } catch (err) {
      console.error("Failed to delete task:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveTags = async () => {
    if (!task) return;
    const nextTags = Array.from(
      new Set(
        tagsInput
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      ),
    );
    const currentTags = task.tags ?? [];
    if (
      nextTags.length === currentTags.length &&
      nextTags.every((tag, i) => tag === currentTags[i])
    ) {
      return;
    }
    await updateTask({ id: taskId, tags: nextTags });
  };

  const hasAudit = Boolean(audit);
  const hasSecondColumn = hasAudit || showProofSection;
  const modalWidthClass = hasSecondColumn
    ? requestChangesPanel
      ? "max-w-[84rem]"
      : "max-w-[72rem]"
    : requestChangesPanel
      ? "max-w-[64rem]"
      : "max-w-[52rem]";

  const layoutGridClass = hasSecondColumn
    ? requestChangesPanel
      ? "grid-cols-1 md:grid-cols-[1fr_1fr_200px_1fr]"
      : "grid-cols-1 md:grid-cols-[1fr_1fr_200px]"
    : requestChangesPanel
      ? "grid-cols-1 md:grid-cols-[1fr_200px_1fr]"
      : "grid-cols-1 md:grid-cols-[1fr_200px]";

  const titleContent = (
    <div className="flex items-center gap-2">
      {task?.taskNumber && (
        <span className="text-muted-foreground font-mono">
          #{task.taskNumber}
        </span>
      )}
      {isEditingTitle ? (
        <Input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={() => {
            const trimmed = editTitle.trim();
            if (canEditTaskText && trimmed && trimmed !== task?.title) {
              updateTask({ id: taskId, title: trimmed });
            }
            setIsEditingTitle(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            } else if (e.key === "Escape") {
              setIsEditingTitle(false);
            }
          }}
          autoFocus
          className="flex-1"
        />
      ) : (
        <span
          onClick={() => {
            if (canEditTaskText) {
              setEditTitle(task?.title ?? "");
              setIsEditingTitle(true);
            }
          }}
          title={
            canEditTaskText ? undefined : "Title can only be edited in To Do"
          }
          className={
            !canEditTaskText
              ? "text-base font-semibold"
              : "text-base font-semibold cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1"
          }
        >
          {task?.title}
        </span>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon-sm"
            variant="ghost"
            className="shrink-0 rounded-full text-muted-foreground hover:text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            <IconDots size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <IconTrash size={16} />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  const scheduledBadge = task?.scheduledAt ? (
    <div className="flex items-center gap-1.5 px-1 -mt-1 mb-1">
      <Badge
        variant="outline"
        className="gap-1 text-xs font-normal text-muted-foreground"
      >
        <IconClock size={11} />
        {status === "todo" ? "Scheduled for" : "Was scheduled for"}{" "}
        {dayjs(task.scheduledAt).format("MMM D, h:mm A")}
      </Badge>
    </div>
  ) : null;

  const descriptionSection = (
    <div>
      <div className="flex items-center justify-end mb-2">
        <span className="text-xs text-muted-foreground">
          {task?.createdAt ? dayjs(task.createdAt).format("MMM D, YYYY") : ""}
        </span>
      </div>
      {isEditingDescription ? (
        <div
          ref={descriptionEditorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={(event) =>
            setEditDescription(event.currentTarget.innerText.replace(/\r/g, ""))
          }
          onBlur={() => {
            const trimmed = editDescription.trim();
            if (canEditTaskText && trimmed !== task?.description) {
              updateTask({ id: taskId, description: trimmed });
            }
            setIsEditingDescription(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.ctrlKey) {
              e.currentTarget.blur();
            } else if (e.key === "Escape") {
              setEditDescription(task?.description ?? "");
              setIsEditingDescription(false);
            }
          }}
          className="min-h-[1.5rem] rounded px-2 py-1 -mx-2 -my-1 text-sm leading-6 text-muted-foreground whitespace-pre-wrap break-words focus:outline-none focus:bg-muted/50"
        />
      ) : task?.description ? (
        (() => {
          const separatorIndex = task.description.indexOf("---");
          const mainDesc =
            separatorIndex !== -1
              ? task.description.slice(0, separatorIndex).trimEnd()
              : task.description;
          const elementDetails =
            separatorIndex !== -1
              ? task.description.slice(separatorIndex + 3).trimStart()
              : null;
          return (
            <>
              <div
                onClick={
                  canEditTaskText
                    ? () => beginDescriptionEdit(task.description ?? "")
                    : undefined
                }
                title={
                  canEditTaskText
                    ? undefined
                    : "Description can only be edited in To Do"
                }
                className={`overflow-x-hidden rounded px-2 py-1 -mx-2 -my-1 ${
                  !canEditTaskText ? "" : "cursor-pointer hover:bg-muted/50"
                }`}
              >
                <Streamdown
                  plugins={{ code }}
                  className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground break-words [&_p]:my-0 [&_p]:break-words [&_li]:my-0.5 [&_li]:break-words [&_a]:break-all [&_code]:break-all [&_pre]:my-2 [&_pre]:whitespace-pre-wrap [&_pre]:break-all [&_pre]:overflow-x-hidden"
                >
                  {mainDesc}
                </Streamdown>
              </div>
              {elementDetails && (
                <Accordion type="single" collapsible className="mt-2 px-0">
                  <AccordionItem value="element-details">
                    <AccordionTrigger>
                      <span className="text-xs text-muted-foreground">
                        Element Details
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <SyntaxHighlighter
                        language="css"
                        style={oneDark}
                        wrapLines
                        wrapLongLines
                        customStyle={{
                          fontSize: "0.75rem",
                          borderRadius: "0.5rem",
                          margin: 0,
                        }}
                      >
                        {elementDetails}
                      </SyntaxHighlighter>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </>
          );
        })()
      ) : (
        <p
          onClick={() => {
            if (canEditTaskText) {
              beginDescriptionEdit("");
            }
          }}
          title={
            canEditTaskText
              ? undefined
              : "Description can only be edited in To Do"
          }
          className={`text-sm text-muted-foreground italic ${
            !canEditTaskText
              ? ""
              : "cursor-pointer hover:bg-muted/50 rounded px-2 py-1 -mx-2 -my-1"
          }`}
        >
          Click to add description...
        </p>
      )}
    </div>
  );

  const subtasksSection =
    subtasks && subtasks.length > 0 ? (
      <div className="pt-4">
        <SubtaskList taskId={taskId} readOnly={status !== "todo"} />
      </div>
    ) : null;

  const sortedRunsDesc = [...(runs ?? [])].sort(
    (a, b) =>
      (b.startedAt ?? b._creationTime) - (a.startedAt ?? a._creationTime),
  );

  const runsSection =
    sortedRunsDesc.length > 0 ? (
      <div className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <IconTerminal2 size={16} />
            Activity
          </h4>
        </div>
        <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar pr-2">
          {sortedRunsDesc.map((run) => {
            const isActiveRun =
              run.status === "running" || run.status === "queued";
            const isExpandedByDefault = isActiveRun || run.status === "error";
            return (
              <Accordion
                key={run._id}
                type="multiple"
                defaultValue={isExpandedByDefault ? [run._id] : []}
              >
                <AccordionItem
                  value={run._id}
                  className="border rounded-lg px-3"
                >
                  <AccordionTrigger>
                    <div className="flex flex-1 items-center justify-between mr-2 min-w-0 gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        {run.status === "success" ? (
                          <IconCircleCheck
                            size={16}
                            className="text-success shrink-0"
                          />
                        ) : run.status === "error" ? (
                          <IconCircleX
                            size={16}
                            className="text-destructive shrink-0"
                          />
                        ) : run.status === "running" ? (
                          <Spinner size="sm" />
                        ) : (
                          <IconClock
                            size={16}
                            className="text-muted-foreground shrink-0"
                          />
                        )}
                        {run._id !== firstRunId && (
                          <IconEdit
                            size={14}
                            className="text-muted-foreground shrink-0"
                          />
                        )}
                        {runCommentMap.has(run._id) && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className="text-muted-foreground hover:text-foreground shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewingCommentForRun(run._id);
                                }}
                              >
                                <IconMessageCircle size={14} />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>View user message</TooltipContent>
                          </Tooltip>
                        )}
                        <span className="text-xs text-muted-foreground truncate">
                          {run.startedAt
                            ? dayjs(run.startedAt).format("M/D/YYYY, h:mm:ss A")
                            : "Queued"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
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
                        {isActiveRun && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStopExecution();
                                  }}
                                  disabled={isStopping || !isOwner}
                                >
                                  {isStopping ? (
                                    <IconLoader2
                                      size={14}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <IconPlayerStop size={14} />
                                  )}
                                  Stop
                                </Button>
                              </div>
                            </TooltipTrigger>
                            {!isOwner && (
                              <TooltipContent>
                                Only the task owner can stop execution
                              </TooltipContent>
                            )}
                          </Tooltip>
                        )}
                      </div>
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
                                <span className="break-all">{log.message}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            );
          })}
        </div>
      </div>
    ) : null;

  const auditProofSection = (
    <>
      {showProofSection && (
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-1.5">
            <IconPhoto size={14} />
            Proof of Completion
          </h4>
          {proofs && proofs.length > 0 ? (
            <ProofCarousel proofs={proofs} />
          ) : (
            <p className="text-sm text-muted-foreground">
              No proof uploaded yet
            </p>
          )}
        </div>
      )}

      {audit && (
        <>
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <IconShieldCheck size={16} />
            Post-Execution Audit
            <Badge
              variant={
                audit.status === "completed"
                  ? "success"
                  : audit.status === "error"
                    ? "destructive"
                    : "warning"
              }
            >
              {audit.status}
            </Badge>
          </h4>
          {audit.status === "running" &&
            auditStreaming?.currentActivity &&
            (() => {
              const steps = parseActivitySteps(auditStreaming.currentActivity);
              return steps ? (
                <ActivitySteps steps={steps} isStreaming name="Auditing" />
              ) : null;
            })()}
          {audit.status === "error" && audit.error && (
            <div className="p-2 bg-destructive/10 rounded text-sm text-destructive">
              {audit.error}
            </div>
          )}
          {audit.status === "completed" && (
            <>
              {audit.summary && (
                <p className="text-sm text-muted-foreground mb-3">
                  {audit.summary}
                </p>
              )}
              <Accordion type="multiple" className="space-y-2">
                {[
                  {
                    key: "accessibility",
                    label: "Accessibility",
                    items: audit.accessibility,
                  },
                  {
                    key: "testing",
                    label: "Code Testing",
                    items: audit.testing,
                  },
                  {
                    key: "codeReview",
                    label: "Code Review",
                    items: audit.codeReview,
                  },
                ].map((section) => (
                  <AccordionItem
                    key={section.key}
                    value={section.key}
                    className="border rounded-lg px-3"
                  >
                    <AccordionTrigger>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{section.label}</span>
                        <Badge
                          variant={
                            section.items.every((i) => i.passed)
                              ? "success"
                              : "destructive"
                          }
                        >
                          {section.items.filter((i) => i.passed).length}/
                          {section.items.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {section.items.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 text-sm"
                          >
                            {item.passed ? (
                              <IconCheck
                                size={16}
                                className="text-success mt-0.5 flex-shrink-0"
                              />
                            ) : (
                              <IconAlertTriangle
                                size={16}
                                className="text-destructive mt-0.5 flex-shrink-0"
                              />
                            )}
                            <div>
                              <span className="font-medium">
                                {item.requirement}
                              </span>
                              <p className="text-muted-foreground">
                                {item.detail}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </>
          )}
        </>
      )}
    </>
  );

  const statusFieldsSection = (
    <>
      <div>
        <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
          <IconCircleDot size={12} />
          Status
        </p>
        <Select
          value={status ?? ""}
          onValueChange={(val) => {
            const matched = TASK_STATUSES.find((s) => s === val);
            if (matched) {
              updateStatus({
                id: taskId,
                status: matched,
              });
            }
          }}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue>
              {status
                ? (() => {
                    const config = statusConfig[status as TaskStatus];
                    const Icon = config.icon;
                    return (
                      <div
                        className={`flex items-center gap-1.5 ${config.text}`}
                      >
                        <Icon size={14} />
                        <span className="text-sm">{config.label}</span>
                      </div>
                    );
                  })()
                : null}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {TASK_STATUSES.map((s) => {
              const config = statusConfig[s];
              const Icon = config.icon;
              return (
                <SelectItem key={s} value={s}>
                  <div className={`flex items-center gap-1.5 ${config.text}`}>
                    <Icon size={14} />
                    <span>{config.label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        {isBlocked && (
          <Badge variant="warning" className="mt-1.5">
            Blocked
          </Badge>
        )}
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
          <IconFolder size={12} />
          Add to Project
        </p>
        <Select
          value={selectedProjectValue}
          onValueChange={(val) => {
            updateTask({
              id: taskId,
              projectId:
                val === NO_PROJECT_VALUE ? null : (val as Id<"projects">),
            });
          }}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="No project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_PROJECT_VALUE}>No project</SelectItem>
            {task?.projectId && !hasSelectedProject && (
              <SelectItem value={task.projectId}>Current project</SelectItem>
            )}
            {projectOptions.map((project) => (
              <SelectItem key={project._id} value={project._id}>
                {project.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
          <IconUserPlus size={12} />
          Assign to ___ for Code Review
        </p>
        <Select
          value={task?.assignedTo ?? ""}
          onValueChange={(val) => {
            const user = users?.find((u) => u._id === val);
            updateTask({ id: taskId, assignedTo: user?._id });
          }}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Unassigned" />
          </SelectTrigger>
          <SelectContent>
            {(users ?? []).map((user) => (
              <SelectItem key={user._id} value={user._id}>
                {user.fullName ||
                  [user.firstName, user.lastName].filter(Boolean).join(" ") ||
                  "Unnamed User"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
          <IconTags size={12} />
          Tags
        </p>
        <Input
          value={tagsInput}
          placeholder="bug, ui, backend"
          className="h-8 text-sm"
          onChange={(e) => setTagsInput(e.target.value)}
          onBlur={() => {
            void handleSaveTags();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleSaveTags();
            }
          }}
        />
        {(task?.tags?.length ?? 0) > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {task?.tags?.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
          <IconBrain size={12} />
          Model
          {status !== "todo" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <IconInfoCircle
                  size={12}
                  className="text-muted-foreground cursor-help"
                />
              </TooltipTrigger>
              <TooltipContent>
                Cannot be modified after task has run
              </TooltipContent>
            </Tooltip>
          )}
        </p>
        <Select
          value={task?.model ?? "sonnet"}
          onValueChange={(val) => {
            const model = CLAUDE_MODELS.find((m) => m === val);
            if (model) updateTask({ id: taskId, model });
          }}
          disabled={status !== "todo"}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CLAUDE_MODELS.map((m) => (
              <SelectItem key={m} value={m}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {!task?.projectId && (
        <div>
          <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <IconGitBranch size={12} />
            Base Branch
            {status !== "todo" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <IconInfoCircle
                    size={12}
                    className="text-muted-foreground cursor-help"
                  />
                </TooltipTrigger>
                <TooltipContent>
                  Cannot be modified after task has run
                </TooltipContent>
              </Tooltip>
            )}
          </p>
          {status === "todo" ? (
            <BranchSelect
              value={baseBranch}
              onValueChange={(val) => {
                setBaseBranch(val);
                updateTask({ id: taskId, baseBranch: val });
              }}
            />
          ) : (
            <div className="flex h-8 items-center gap-1.5 rounded-md border border-input bg-muted px-3 text-sm">
              <IconGitBranch size={14} className="text-muted-foreground" />
              <span className="text-foreground">{baseBranch}</span>
            </div>
          )}
        </div>
      )}
      {latestDeployment?.deploymentStatus && (
        <div>
          <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
            <IconBrandVercel size={12} />
            Deploy Status
          </p>
          <div className="flex h-8 items-center gap-1.5 rounded-md border border-input bg-muted px-3 text-sm">
            <span
              className={`h-2 w-2 rounded-full ${
                latestDeployment.deploymentStatus === "deployed"
                  ? "bg-emerald-500"
                  : latestDeployment.deploymentStatus === "error"
                    ? "bg-red-500"
                    : latestDeployment.deploymentStatus === "building"
                      ? "bg-amber-500 animate-pulse"
                      : "bg-blue-500 animate-pulse"
              }`}
            />
            <span className="text-foreground">
              {latestDeployment.deploymentStatus === "deployed"
                ? "Deployed"
                : latestDeployment.deploymentStatus === "building"
                  ? "Building"
                  : latestDeployment.deploymentStatus === "error"
                    ? "Deploy failed"
                    : "Queued"}
            </span>
          </div>
        </div>
      )}
    </>
  );

  const requestChangesSection = (
    <>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-foreground">
          Ask Eva to make changes
        </h4>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => setRequestChangesPanel(false)}
        >
          <IconX size={16} />
        </Button>
      </div>
      <form
        onSubmit={handleAddComment}
        className="flex gap-2 items-center bg-card rounded-lg"
      >
        <Textarea
          rows={3}
          placeholder="Describe the changes you'd like Eva to make..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleAddComment(e);
            }
          }}
        />
        <Button
          size="icon"
          type="submit"
          className="mt-auto mb-2 mr-2 rounded-full"
          disabled={!commentText.trim()}
        >
          <IconArrowUp size={18} />
        </Button>
      </form>
    </>
  );

  const footerButtons = (
    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
      {latestPrUrl && (status === "code_review" || status === "done") && (
        <Button asChild variant="outline">
          <a href={latestPrUrl} target="_blank" rel="noopener noreferrer">
            <IconGitPullRequest size={18} />
            <span className="hidden sm:inline">View PR</span>
          </a>
        </Button>
      )}
      {latestDeployment?.deploymentStatus && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Button
                asChild={
                  latestDeployment.deploymentStatus === "deployed" &&
                  !!latestDeployment.deploymentUrl
                }
                variant="outline"
                disabled={latestDeployment.deploymentStatus !== "deployed"}
              >
                {latestDeployment.deploymentStatus === "deployed" &&
                latestDeployment.deploymentUrl ? (
                  <a
                    href={latestDeployment.deploymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <IconBrandVercel size={18} />
                    <span className="hidden sm:inline">View Preview</span>
                  </a>
                ) : (
                  <>
                    <IconBrandVercel size={18} />
                    <span className="hidden sm:inline">View Preview</span>
                  </>
                )}
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {latestDeployment.deploymentStatus === "deployed"
              ? "Open preview deployment"
              : latestDeployment.deploymentStatus === "error"
                ? "Deployment failed"
                : latestDeployment.deploymentStatus === "building"
                  ? "Deployment is building..."
                  : "Deployment is queued..."}
          </TooltipContent>
        </Tooltip>
      )}
      {!requestChangesPanel &&
        status !== "todo" &&
        status !== "in_progress" && (
          <Button
            variant="secondary"
            onClick={() => setRequestChangesPanel(true)}
          >
            <IconMessagePlus size={18} />
            <span className="hidden sm:inline">Request Changes</span>
          </Button>
        )}
      {hasActiveRun ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Button
                variant="destructive"
                onClick={handleStopExecution}
                disabled={isStopping || !isOwner}
              >
                {isStopping ? (
                  <IconLoader2 size={18} className="animate-spin" />
                ) : (
                  <IconPlayerStop size={18} />
                )}
                Stop
              </Button>
            </div>
          </TooltipTrigger>
          {!isOwner && (
            <TooltipContent>
              Only the task owner can stop execution
            </TooltipContent>
          )}
        </Tooltip>
      ) : (
        !hasActiveRun &&
        status === "todo" && (
          <>
            <SchedulePopover
              taskId={taskId}
              scheduledAt={task?.scheduledAt}
              disabled={!isOwner || isBlocked}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    onClick={handleStartExecution}
                    disabled={
                      isStarting ||
                      isBlocked ||
                      !isOwner ||
                      task?.scheduledAt !== undefined
                    }
                  >
                    {isStarting ? (
                      <IconLoader2 size={18} className="animate-spin" />
                    ) : (
                      <IconPlayerPlay size={18} />
                    )}
                    Run Eva
                  </Button>
                </div>
              </TooltipTrigger>
              {task?.scheduledAt !== undefined ? (
                <TooltipContent>
                  Task is scheduled — remove the schedule to run immediately
                </TooltipContent>
              ) : (
                !isOwner && (
                  <TooltipContent>
                    Only the task owner can run Eva
                  </TooltipContent>
                )
              )}
            </Tooltip>
          </>
        )
      )}
    </div>
  );

  const deleteConfirmDialog = (
    <Dialog
      open={showDeleteConfirm}
      onOpenChange={(v) => {
        if (!v) setShowDeleteConfirm(false);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Task</DialogTitle>
        </DialogHeader>
        <div>
          <p className="text-muted-foreground">
            Are you sure you want to delete{" "}
            <strong>
              {task?.taskNumber ? `#${task.taskNumber} ` : ""}
              {task?.title}
            </strong>
            ?
          </p>
          {dependentTasks && dependentTasks.length > 0 && (
            <div className="mt-3 p-3 bg-warning-bg rounded-lg">
              <p className="text-sm font-medium text-warning mb-2">
                The following tasks depend on this task and will also be
                deleted:
              </p>
              <ul className="text-sm text-warning space-y-1">
                {dependentTasks.map((t) => (
                  <li key={t._id}>
                    {t.taskNumber ? `#${t.taskNumber} ` : ""}
                    {t.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-sm text-muted-foreground mt-3">
            This action cannot be undone.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting && <IconLoader2 size={16} className="animate-spin" />}
            Delete
            {dependentTasks && dependentTasks.length > 0
              ? ` ${dependentTasks.length + 1} Tasks`
              : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const userMessageDialog = (
    <Dialog
      open={viewingCommentForRun !== null}
      onOpenChange={(v) => {
        if (!v) setViewingCommentForRun(null);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>User Message</DialogTitle>
        </DialogHeader>
        {viewingComment && (
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground">
              {dayjs(viewingComment.createdAt).fromNow()}
            </span>
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {viewingComment.content}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  return {
    titleContent,
    scheduledBadge,
    descriptionSection,
    subtasksSection,
    runsSection,
    auditProofSection,
    statusFieldsSection,
    requestChangesSection,
    footerButtons,
    deleteConfirmDialog,
    userMessageDialog,
    audit,
    showProofSection,
    requestChangesPanel,
    layoutGridClass,
    modalWidthClass,
  };
}
