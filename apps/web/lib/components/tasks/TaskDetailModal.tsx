"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
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
  IconUpload,
  IconPhoto,
  IconLoader2,
  IconShieldCheck,
  IconCheck,
  IconAlertTriangle,
  IconCircleDot,
  IconUserPlus,
  IconBrain,
} from "@tabler/icons-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import dayjs from "@conductor/shared/dates";

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: Id<"agentTasks">;
}

export function TaskDetailModal({
  isOpen,
  onClose,
  taskId,
}: TaskDetailModalProps) {
  const task = useQuery(api.agentTasks.get, { id: taskId });
  const currentUserId = useQuery(api.auth.me);
  const isOwner = currentUserId === task?.createdBy;
  const isBlocked = useQuery(api.taskDependencies.isBlocked, { taskId });
  const runs = useQuery(api.agentRuns.listByTask, { taskId });
  const hasActiveRun = runs?.some(
    (r) => r.status === "queued" || r.status === "running",
  );
  const streaming = useQuery(
    api.streaming.get,
    hasActiveRun ? { entityId: taskId } : "skip",
  );
  const audit = useQuery(api.taskAudits.getByTask, { taskId });
  const auditStreaming = useQuery(
    api.streaming.get,
    audit?.status === "running" ? { entityId: `audit-${taskId}` } : "skip",
  );
  const dependentTasks = useQuery(api.agentTasks.getDependentTasks, { taskId });
  const users = useQuery(api.users.listAll);
  const startExecution = useMutation(api.agentTasks.startExecution);
  const updateTask = useMutation(api.agentTasks.update);
  const updateStatus = useMutation(api.agentTasks.updateStatus);
  const deleteTask = useMutation(api.agentTasks.deleteCascade);
  const comments = useQuery(api.taskComments.listByTask, { taskId });
  const createComment = useMutation(api.taskComments.create);
  const removeComment = useMutation(api.taskComments.remove);
  const subtasks = useQuery(api.subtasks.listByTask, { parentTaskId: taskId });
  const proofs = useQuery(api.taskProof.listByTask, { taskId });
  const generateUploadUrl = useMutation(api.taskProof.generateUploadUrl);
  const saveProof = useMutation(api.taskProof.save);
  const removeProof = useMutation(api.taskProof.remove);
  const [isStarting, setIsStarting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [requestChangesPanel, setRequestChangesPanel] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments?.length]);

  const handleAddComment = async (e: FormEvent) => {
    e.preventDefault();
    const text = commentText.trim();
    if (!text) return;
    setCommentText("");
    await createComment({ taskId, content: text });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadProof = async (file: File) => {
    setIsUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      await saveProof({
        taskId,
        storageId,
        fileName: file.name,
        fileType: file.type,
      });
    } catch (err) {
      console.error("Failed to upload proof:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const latestPrUrl = runs?.find((r) => r.prUrl)?.prUrl;
  const status = task?.status;
  const showProofSection = status !== "todo" && status !== "in_progress";

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
            projectId: result.projectId,
            branchName: result.branchName,
            isFirstTaskOnBranch: result.isFirstTaskOnBranch,
            model: result.model,
          },
        }),
      });
    } catch (err) {
      console.error("Failed to start execution:", err);
    } finally {
      setIsStarting(false);
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

  const hasAudit = Boolean(audit);
  const modalWidthClass = hasAudit
    ? requestChangesPanel
      ? "w-[min(96vw,96rem)]"
      : "w-[min(95vw,84rem)]"
    : requestChangesPanel
      ? "w-[min(95vw,72rem)]"
      : "w-[min(95vw,64rem)]";

  const layoutGridClass = hasAudit
    ? requestChangesPanel
      ? "grid-cols-[1fr_1fr_200px_1fr]"
      : "grid-cols-[1fr_1fr_200px]"
    : requestChangesPanel
      ? "grid-cols-[1fr_200px_1fr]"
      : "grid-cols-[1fr_200px]";

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(v) => {
          if (!v) onClose();
        }}
      >
        <DialogContent
          className={`${modalWidthClass} max-h-[85vh] overflow-y-auto`}
        >
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-2">
                {task?.taskNumber && (
                  <span className="text-muted-foreground font-mono">
                    #{task.taskNumber}
                  </span>
                )}
                <span>{task?.title}</span>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="pb-6">
            <div className={`grid gap-6 min-h-[400px] ${layoutGridClass}`}>
              <div className="space-y-6 overflow-y-auto scrollbar pr-2">
                {task?.description &&
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
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-2">
                          Description
                        </h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {mainDesc}
                        </p>
                        {elementDetails && (
                          <Accordion
                            type="single"
                            collapsible
                            className="mt-2 px-0"
                          >
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
                      </div>
                    );
                  })()}

                {subtasks && subtasks.length > 0 && (
                  <div className="pt-4">
                    <SubtaskList taskId={taskId} readOnly={status !== "todo"} />
                  </div>
                )}

                {runs && runs.length > 0 && (
                  <div className="pt-4">
                    <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                      <IconTerminal2 size={16} />
                      Agent Runs ({runs.length})
                    </h4>
                    <Accordion type="multiple" className="space-y-2">
                      {runs.map((run) => (
                        <AccordionItem
                          key={run._id}
                          value={run._id}
                          className="border rounded-lg px-3"
                        >
                          <AccordionTrigger>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  run.status === "success"
                                    ? "success"
                                    : run.status === "error"
                                      ? "destructive"
                                      : run.status === "running"
                                        ? "warning"
                                        : "outline"
                                }
                              >
                                {run.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {run.startedAt
                                  ? dayjs(run.startedAt).format(
                                      "M/D/YYYY, h:mm:ss A",
                                    )
                                  : "Queued"}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2">
                              {run.status === "running" &&
                                streaming?.currentActivity && (
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
                                )}
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
                              {run.prUrl && (
                                <a
                                  href={run.prUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary hover:underline"
                                >
                                  View Pull Request
                                </a>
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
                                            "h:mm:ss A",
                                          )}
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

                {showProofSection && (
                  <div className="pt-4">
                    <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-1.5">
                      <IconPhoto size={14} />
                      Proof of Completion
                    </h4>
                    {proofs && proofs.length > 0 && (
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        {proofs.map((proof) => (
                          <div
                            key={proof._id}
                            className="group relative rounded-lg overflow-hidden bg-muted"
                          >
                            {proof.url &&
                              proof.fileType.startsWith("image/") && (
                                <img
                                  src={proof.url}
                                  alt={proof.fileName}
                                  className="w-full h-32 object-cover"
                                />
                              )}
                            {proof.url &&
                              proof.fileType.startsWith("video/") && (
                                <video
                                  src={proof.url}
                                  controls
                                  className="w-full h-32 object-cover"
                                />
                              )}
                            <div className="flex items-center justify-between p-2">
                              <span className="text-xs text-muted-foreground truncate">
                                {proof.fileName}
                              </span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100"
                                onClick={() => removeProof({ id: proof._id })}
                              >
                                <IconTrash size={14} />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleUploadProof(file);
                          e.target.value = "";
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <IconLoader2 size={14} className="animate-spin" />
                      ) : (
                        <IconUpload size={14} />
                      )}
                      Upload Proof
                    </Button>
                  </div>
                )}
              </div>

              {audit && (
                <div className="pl-4 space-y-4 overflow-y-auto scrollbar">
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
                    auditStreaming?.currentActivity && (
                      <Reasoning isStreaming defaultOpen>
                        <ReasoningTrigger
                          getThinkingMessage={(s) =>
                            s ? "Auditing..." : "Audit complete"
                          }
                        />
                        <ReasoningContent>
                          {auditStreaming.currentActivity}
                        </ReasoningContent>
                      </Reasoning>
                    )}
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
                                  {section.items.filter((i) => i.passed).length}
                                  /{section.items.length}
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
                </div>
              )}

              <div className="pl-4 space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <IconCircleDot size={12} />
                    Status
                  </p>
                  <Select
                    value={status ?? ""}
                    onValueChange={(val) => {
                      if (TASK_STATUSES.includes(val as TaskStatus)) {
                        updateStatus({
                          id: taskId,
                          status: val as TaskStatus,
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
                                  <span className="text-sm">
                                    {config.label}
                                  </span>
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
                            <div
                              className={`flex items-center gap-1.5 ${config.text}`}
                            >
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
                            [user.firstName, user.lastName]
                              .filter(Boolean)
                              .join(" ") ||
                            "Unnamed User"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <IconBrain size={12} />
                    Model
                  </p>
                  <Select
                    value={task?.model ?? "sonnet"}
                    onValueChange={(val) => {
                      const model = CLAUDE_MODELS.find((m) => m === val);
                      if (model) updateTask({ id: taskId, model });
                    }}
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
                {latestPrUrl && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                      <IconGitPullRequest size={12} />
                      Pull Request
                    </p>
                    <a
                      href={latestPrUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <IconGitPullRequest size={14} />
                      View PR
                    </a>
                  </div>
                )}
              </div>

              {requestChangesPanel && (
                <div className="flex flex-col border-l border-border pl-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-foreground">
                      Ask Eva to make changes{" "}
                      {comments &&
                        comments.length > 0 &&
                        `(${comments.length})`}
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
                  <div className="flex-1 overflow-y-auto scrollbar space-y-3 mb-3">
                    {(!comments || comments.length === 0) && (
                      <p className="text-sm text-muted-foreground">
                        No change requests yet.
                      </p>
                    )}
                    {comments?.map((comment) => (
                      <div
                        key={comment._id}
                        className="group rounded-lg bg-muted p-3"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">
                            {dayjs(comment.createdAt).fromNow()}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100"
                            onClick={() => removeComment({ id: comment._id })}
                          >
                            <IconTrash size={14} />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>
                    ))}
                    <div ref={commentsEndRef} />
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
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="justify-between sm:justify-between">
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={!isOwner}
                  >
                    <IconTrash size={18} />
                    Delete
                  </Button>
                </div>
              </TooltipTrigger>
              {!isOwner && (
                <TooltipContent>Only the task owner can delete</TooltipContent>
              )}
            </Tooltip>
            <div className="flex items-center gap-2">
              {!requestChangesPanel &&
                status !== "todo" &&
                status !== "in_progress" && (
                  <Button
                    variant="secondary"
                    onClick={() => setRequestChangesPanel(true)}
                  >
                    <IconMessagePlus size={18} />
                    Request Changes
                  </Button>
                )}
              {status === "todo" ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button
                        onClick={handleStartExecution}
                        disabled={
                          isStarting || isBlocked || hasActiveRun || !isOwner
                        }
                      >
                        {isStarting ? (
                          <IconLoader2 size={18} className="animate-spin" />
                        ) : (
                          <IconPlayerPlay size={18} />
                        )}
                        {hasActiveRun ? "Running..." : "Run Eva"}
                      </Button>
                    </div>
                  </TooltipTrigger>
                  {!isOwner && (
                    <TooltipContent>
                      Only the task owner can run Eva
                    </TooltipContent>
                  )}
                </Tooltip>
              ) : latestPrUrl &&
                (status === "code_review" || status === "done") ? (
                <Button asChild>
                  <a
                    href={latestPrUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <IconGitPullRequest size={18} />
                    Open PR
                  </a>
                </Button>
              ) : null}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
    </>
  );
}
