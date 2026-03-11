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
  useElapsedSeconds,
  formatElapsed,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  CarouselDots,
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
  IconTrash,
  IconGitPullRequest,
  IconArrowUp,
  IconMessagePlus,
  IconLoader2,
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
  IconBrandVercel,
  IconHammer,
} from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import dayjs from "@conductor/shared/dates";
import { parseActivitySteps } from "@/lib/utils/parseActivitySteps";
import { formatDuration } from "@/lib/utils/formatDuration";
import { BranchSelect } from "@/lib/components/BranchSelect";
import { ScreenshotPreview, VideoPreview } from "@/lib/components/MediaPreview";
import { SchedulePopover } from "./SchedulePopover";
import { RunActivityLog } from "./RunActivityLog";
import { AuditActivityLog } from "./AuditActivityLog";

const NO_PROJECT_VALUE = "__none__";

export function useTaskDetail(
  taskId: Id<"agentTasks">,
  onClose: () => void,
  inline = false,
) {
  const task = useQuery(api.agentTasks.get, { id: taskId });
  const currentUserId = useQuery(api.auth.me);
  const isOwner = currentUserId === task?.createdBy;
  const isBlocked = useQuery(api.taskDependencies.isBlocked, { taskId });
  const runs = useQuery(api.agentRuns.listByTask, { taskId });
  const hasActiveRun = runs?.some(
    (run) => run.status === "queued" || run.status === "running",
  );
  const activeRun = runs?.find((run) => run.status === "running");
  const activeRunElapsed = useElapsedSeconds(
    activeRun?.startedAt,
    Boolean(activeRun),
  );
  const streaming = useQuery(
    api.streaming.get,
    activeRun ? { entityId: `task-run-${activeRun._id}` } : "skip",
  );
  const allAudits = useQuery(api.audits.listByTask, { taskId });
  const latestAudit = allAudits?.[0] ?? null;
  const pastAudits = allAudits?.slice(1) ?? [];
  const auditStreaming = useQuery(
    api.streaming.get,
    (latestAudit?.status === "running" ||
      latestAudit?.fixStatus === "fixing") &&
      latestAudit?.runId
      ? { entityId: `task-audit-run-${latestAudit.runId}` }
      : "skip",
  );
  const users = useQuery(api.users.listAll);
  const projects = useQuery(
    api.projects.list,
    task?.repoId ? { repoId: task.repoId } : "skip",
  );
  const startExecution = useMutation(api.agentTasks.startExecution);
  const cancelExecution = useMutation(api.taskWorkflow.cancelExecution);
  const updateTask = useMutation(api.agentTasks.update);
  const updateStatus = useMutation(api.agentTasks.updateStatus);
  const allComments = useQuery(api.taskComments.listByTask, { taskId });
  const comments = allComments?.filter((c) => c.authorId);
  const createComment = useMutation(api.taskComments.create);
  const removeComment = useMutation(api.taskComments.remove);
  const subtasks = useQuery(api.subtasks.listByTask, { parentTaskId: taskId });
  const proofs = useQuery(api.taskProof.listByTask, { taskId });
  const [baseBranch, setBaseBranch] = useState("main");
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [showResolveConfirm, setShowResolveConfirm] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [activeTab, setActiveTab] = useState<
    "activity" | "proof" | "audit" | "comments"
  >("activity");
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [requestingChanges, setRequestingChanges] = useState(false);
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

  const handleAddComment = async (requestChanges = false) => {
    const text = commentText.trim();
    if (!text) return;
    setCommentText("");
    try {
      await createComment({ taskId, content: text });

      if (requestChanges) {
        try {
          await startExecution({ id: taskId });
          setActiveTab("activity");
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to start execution";
          setExecutionError(message);
        }
      }
    } finally {
      setRequestingChanges(false);
    }
  };

  const latestPrUrl = runs?.find((r) => r.prUrl)?.prUrl;
  const latestDeployment = runs?.find((r) => r.deploymentStatus);
  const status = task?.status;
  const showProofSection = status !== undefined && status !== "todo";
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

  const handleResolveConflicts = async () => {
    setIsStarting(true);
    try {
      await startExecution({ id: taskId, mode: "resolve_conflicts" });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start execution";
      setExecutionError(message);
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

  const modalWidthClass = "max-w-[72rem]";
  const layoutGridClass = "grid-cols-1 md:grid-cols-[1fr_1fr_200px]";

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
          className="flex-1 text-base font-semibold h-auto px-1 -mx-1 py-0 border-none shadow-none focus-visible:ring-0 bg-muted/50 rounded"
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
        {dayjs(task.scheduledAt).format("DD/MM/YYYY HH:mm")}
      </Badge>
    </div>
  ) : null;

  const descriptionSection = (
    <div>
      <div className="flex items-center justify-end mb-2">
        <span className="text-xs text-muted-foreground">
          {task?.createdAt
            ? dayjs(task.createdAt).format("DD/MM/YYYY HH:mm")
            : ""}
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
          className="min-h-[1.5rem] rounded px-2 py-1 -mx-2 -my-1 text-sm leading-[1.7142857] text-muted-foreground whitespace-pre-wrap break-words focus:outline-none focus:bg-muted/50"
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
                className={`overflow-x-hidden rounded px-2 py-1 -mx-2 -my-1 ${inline ? "max-h-[40vh] overflow-y-auto scrollbar" : ""} ${
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
        <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar pr-2">
          {latestAudit && latestAudit.fixStatus && (
            <Accordion
              type="multiple"
              defaultValue={
                latestAudit.fixStatus === "fixing" ? ["fix-streaming"] : []
              }
            >
              <AccordionItem
                value="fix-streaming"
                className="border rounded-lg px-3"
              >
                <AccordionTrigger>
                  <div className="flex flex-1 items-center justify-between mr-2 min-w-0 gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <Badge
                        variant={
                          latestAudit.fixStatus === "fixing"
                            ? "warning"
                            : latestAudit.fixStatus === "fix_error"
                              ? "destructive"
                              : "success"
                        }
                      >
                        {latestAudit.fixStatus === "fixing"
                          ? "fixing audit issues"
                          : latestAudit.fixStatus === "fix_error"
                            ? "fix error"
                            : "fixed audit issues"}
                      </Badge>
                      <span className="text-xs text-muted-foreground truncate">
                        {dayjs(latestAudit.createdAt).format(
                          "DD/MM/YYYY HH:mm",
                        )}
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {latestAudit.fixStatus === "fixing" &&
                      auditStreaming?.currentActivity &&
                      (() => {
                        const steps = parseActivitySteps(
                          auditStreaming.currentActivity,
                        );
                        return steps ? (
                          <ActivitySteps
                            steps={steps}
                            isStreaming
                            name="Fixing"
                          />
                        ) : null;
                      })()}
                    {latestAudit.fixStatus !== "fixing" &&
                      latestAudit.runId && (
                        <AuditActivityLog
                          runId={latestAudit.runId}
                          type="fix"
                        />
                      )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
          {latestAudit && (
            <Accordion
              type="multiple"
              defaultValue={
                latestAudit.status === "running" ? ["audit-streaming"] : []
              }
            >
              <AccordionItem
                value="audit-streaming"
                className="border rounded-lg px-3"
              >
                <AccordionTrigger>
                  <div className="flex flex-1 items-center justify-between mr-2 min-w-0 gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <Badge
                        variant={
                          latestAudit.status === "running"
                            ? "warning"
                            : latestAudit.status === "error"
                              ? "destructive"
                              : "success"
                        }
                      >
                        {latestAudit.status === "running"
                          ? "auditing"
                          : latestAudit.status === "error"
                            ? "audit error"
                            : "audited"}
                      </Badge>
                      <span className="text-xs text-muted-foreground truncate">
                        {dayjs(latestAudit.createdAt).format(
                          "DD/MM/YYYY HH:mm",
                        )}
                      </span>
                    </div>
                    {latestAudit.status === "completed" &&
                      latestAudit.sections.length > 0 && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {latestAudit.sections.reduce(
                            (sum, s) =>
                              sum + s.results.filter((r) => r.passed).length,
                            0,
                          )}
                          /
                          {latestAudit.sections.reduce(
                            (sum, s) => sum + s.results.length,
                            0,
                          )}{" "}
                          passed
                        </span>
                      )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {latestAudit.status === "running" &&
                      auditStreaming?.currentActivity &&
                      (() => {
                        const steps = parseActivitySteps(
                          auditStreaming.currentActivity,
                        );
                        return steps ? (
                          <ActivitySteps
                            steps={steps}
                            isStreaming
                            name="Auditing"
                          />
                        ) : null;
                      })()}
                    {latestAudit.status !== "running" && latestAudit.runId && (
                      <AuditActivityLog
                        runId={latestAudit.runId}
                        type="audit"
                      />
                    )}
                    {latestAudit.status === "error" && (
                      <p className="text-sm text-destructive">
                        {latestAudit.error ?? "Audit failed"}
                      </p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
          {sortedRunsDesc.map((run) => {
            const isActiveRun =
              run.status === "running" || run.status === "queued";
            return (
              <Accordion
                key={run._id}
                type="multiple"
                defaultValue={isActiveRun ? [run._id] : []}
              >
                <AccordionItem
                  value={run._id}
                  className="border rounded-lg px-3"
                >
                  <AccordionTrigger>
                    <div className="flex flex-1 items-center justify-between mr-2 min-w-0 gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <Badge
                          variant={
                            run.status === "running"
                              ? "warning"
                              : run.status === "error"
                                ? "destructive"
                                : run.status === "success"
                                  ? "success"
                                  : "secondary"
                          }
                        >
                          {run.mode === "resolve_conflicts"
                            ? run.status === "running"
                              ? "resolving conflicts"
                              : run.status === "success"
                                ? "resolved conflicts"
                                : run.status === "error"
                                  ? "error"
                                  : "queued"
                            : runCommentMap.has(run._id)
                              ? run.status === "running"
                                ? "making changes"
                                : run.status === "success"
                                  ? "made changes"
                                  : run.status === "error"
                                    ? "error"
                                    : "queued"
                              : run.status === "running"
                                ? "running"
                                : run.status === "success"
                                  ? "success"
                                  : run.status === "error"
                                    ? "error"
                                    : "queued"}
                        </Badge>
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
                                <IconMessagePlus size={14} />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>View user message</TooltipContent>
                          </Tooltip>
                        )}
                        <span className="text-xs text-muted-foreground truncate">
                          {run.startedAt
                            ? dayjs(run.startedAt).format("DD/MM/YYYY HH:mm")
                            : "Queued"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isActiveRun && run.startedAt ? (
                          <span className="text-xs text-muted-foreground">
                            {formatElapsed(activeRunElapsed)}
                          </span>
                        ) : run.startedAt && run.finishedAt ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-xs text-muted-foreground">
                                {formatDuration(run.startedAt, run.finishedAt)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              Completed{" "}
                              {dayjs(run.finishedAt).format("DD/MM/YYYY HH:mm")}
                            </TooltipContent>
                          </Tooltip>
                        ) : null}
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
                                    setShowStopConfirm(true);
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
                                  {dayjs(log.timestamp).format(
                                    "DD/MM/YYYY HH:mm",
                                  )}
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

  const mediaProofs = proofs?.filter(
    (p) =>
      p.url &&
      (p.contentType?.startsWith("image/") ||
        p.contentType?.startsWith("video/")),
  );
  const messageProofs = proofs?.filter((p) => p.message);

  const proofSection = showProofSection ? (
    <div className="space-y-3">
      {mediaProofs && mediaProofs.length > 0 ? (
        <div className="px-6">
          <Carousel opts={{ loop: mediaProofs.length > 1 }}>
            <CarouselContent>
              {mediaProofs.map((proof) => (
                <CarouselItem key={proof._id}>
                  {proof.url && proof.contentType?.startsWith("image/") ? (
                    <ScreenshotPreview url={proof.url} />
                  ) : proof.url && proof.contentType?.startsWith("video/") ? (
                    <VideoPreview url={proof.url} />
                  ) : null}
                </CarouselItem>
              ))}
            </CarouselContent>
            {mediaProofs.length > 1 && (
              <>
                <CarouselPrevious />
                <CarouselNext />
                <CarouselDots />
              </>
            )}
          </Carousel>
        </div>
      ) : null}
      {messageProofs && messageProofs.length > 0
        ? messageProofs.map((proof) => (
            <p key={proof._id} className="text-sm text-muted-foreground">
              {proof.message}
            </p>
          ))
        : null}
      {(!proofs || proofs.length === 0) &&
        (status === "in_progress" ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <IconLoader2 size={14} className="animate-spin" />
            Waiting for proof upload...
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No proof uploaded yet</p>
        ))}
    </div>
  ) : (
    <p className="text-sm text-muted-foreground">No proof available</p>
  );

  const [showPastAudits, setShowPastAudits] = useState(false);

  const renderAuditResults = (auditData: NonNullable<typeof latestAudit>) => (
    <div className="space-y-3">
      <Badge
        variant={
          auditData.status === "completed"
            ? "success"
            : auditData.status === "error"
              ? "destructive"
              : "warning"
        }
      >
        {auditData.status}
      </Badge>
      {auditData.status === "error" && auditData.error && (
        <div className="p-2 bg-destructive/10 rounded text-sm text-destructive">
          {auditData.error}
        </div>
      )}
      {auditData.status === "completed" && (
        <>
          {auditData.summary && (
            <p className="text-sm text-muted-foreground mb-3">
              {auditData.summary}
            </p>
          )}
          <Accordion type="multiple" className="space-y-2">
            {auditData.sections
              .filter((section) => section.results.length > 0)
              .map((section) => (
                <AccordionItem
                  key={section.name}
                  value={section.name}
                  className="border rounded-lg px-3"
                >
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{section.name}</span>
                      <Badge
                        variant={
                          section.results.every((i) => i.passed)
                            ? "success"
                            : "destructive"
                        }
                      >
                        {section.results.filter((i) => i.passed).length}/
                        {section.results.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {section.results.map((item, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
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
          {auditData.fixStatus === "fix_completed" && (
            <Badge variant="success" className="mt-3">
              Fixed audit issues
            </Badge>
          )}
          {auditData.fixStatus === "fix_error" && (
            <Badge variant="destructive" className="mt-3">
              Fix failed
            </Badge>
          )}
        </>
      )}
    </div>
  );

  const auditSection = latestAudit ? (
    <div className="space-y-4">
      {renderAuditResults(latestAudit)}
      {pastAudits.length > 0 && (
        <div>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowPastAudits((v) => !v)}
          >
            {showPastAudits ? "Hide" : "Show"} past audits ({pastAudits.length})
          </button>
          {showPastAudits && (
            <div className="mt-3 space-y-4 border-t pt-3">
              {pastAudits.map((pastAudit) => (
                <div key={pastAudit._id} className="space-y-2">
                  <span className="text-xs text-muted-foreground">
                    {dayjs(pastAudit.createdAt).format("DD/MM/YYYY HH:mm")}
                  </span>
                  {renderAuditResults(pastAudit)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  ) : (
    <p className="text-sm text-muted-foreground">No audit available</p>
  );

  const commentsSection = (
    <div className="space-y-4">
      {comments && comments.length > 0 && (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment._id}
              className="rounded-lg border border-border p-3 space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {dayjs(comment.createdAt).fromNow()}
                </span>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={() => removeComment({ id: comment._id })}
                >
                  <IconTrash size={12} />
                </Button>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2 items-end">
        <Textarea
          rows={3}
          placeholder={
            requestingChanges
              ? "Describe the changes you'd like Eva to make..."
              : "Add a comment..."
          }
          value={commentText}
          onChange={(e) => {
            setCommentText(e.target.value);
            if (executionError) setExecutionError(null);
          }}
          className="flex-1"
        />
        <Button
          size="icon"
          className="rounded-full shrink-0"
          disabled={!commentText.trim()}
          onClick={() => handleAddComment(requestingChanges)}
        >
          <IconArrowUp size={18} />
        </Button>
      </div>
      {requestingChanges && !executionError && (
        <p className="text-xs text-muted-foreground">
          Submitting will create a comment and re-run Eva with your changes
        </p>
      )}
    </div>
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
          Project
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
          Assign for Code Review
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

  const footerButtons = (
    <div className="space-y-2">
      {executionError && (
        <p className="text-xs text-destructive text-right">{executionError}</p>
      )}
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
        {status !== "todo" && status !== "in_progress" && (
          <Button
            variant="secondary"
            onClick={() => {
              setRequestingChanges(true);
              setActiveTab("comments");
            }}
          >
            <IconMessagePlus size={18} />
            <span className="hidden sm:inline">Request Changes</span>
          </Button>
        )}
        {!hasActiveRun && status === "code_review" && (
          <Button
            variant="secondary"
            onClick={() => setShowResolveConfirm(true)}
            disabled={isStarting}
          >
            {isStarting ? (
              <IconLoader2 size={18} className="animate-spin" />
            ) : (
              <IconHammer size={18} />
            )}
            <span className="hidden sm:inline">Resolve Conflicts</span>
          </Button>
        )}
        {!hasActiveRun && status === "todo" && (
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
        )}
      </div>
    </div>
  );

  const stopConfirmDialog = (
    <Dialog
      open={showStopConfirm}
      onOpenChange={(v) => {
        if (!v) setShowStopConfirm(false);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Stop Execution</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground">
          This will stop the agent mid-execution. Any uncommitted progress on
          this run will be lost.
        </p>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setShowStopConfirm(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              setShowStopConfirm(false);
              handleStopExecution();
            }}
            disabled={isStopping}
          >
            {isStopping && <IconLoader2 size={16} className="animate-spin" />}
            Stop Execution
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const resolveConfirmDialog = (
    <Dialog
      open={showResolveConfirm}
      onOpenChange={(v) => {
        if (!v) setShowResolveConfirm(false);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Resolve Conflicts</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground">
          This will start the agent to merge the latest base branch changes and
          resolve any conflicts. The task will remain in code review after
          completion.
        </p>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setShowResolveConfirm(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setShowResolveConfirm(false);
              handleResolveConflicts();
            }}
            disabled={isStarting}
          >
            {isStarting && <IconLoader2 size={16} className="animate-spin" />}
            Resolve Conflicts
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

  const hasTabContent =
    (runs !== undefined && runs.length > 0) ||
    (proofs !== undefined && proofs.length > 0) ||
    latestAudit !== null ||
    (comments !== undefined && comments.length > 0);

  const showTabsColumn = status !== "todo" || hasTabContent;

  return {
    titleContent,
    scheduledBadge,
    descriptionSection,
    subtasksSection,
    runsSection,
    proofSection,
    auditSection,
    commentsSection,
    statusFieldsSection,
    footerButtons,
    stopConfirmDialog,
    resolveConfirmDialog,
    userMessageDialog,
    latestAudit,
    showProofSection,
    showTabsColumn,
    activeTab,
    setActiveTab,
    layoutGridClass,
    modalWidthClass,
    isActivityBusy:
      Boolean(hasActiveRun) ||
      latestAudit?.status === "running" ||
      latestAudit?.fixStatus === "fixing",
    isProofBusy: status === "in_progress",
    isAuditBusy:
      latestAudit?.status === "running" || latestAudit?.fixStatus === "fixing",
  };
}
