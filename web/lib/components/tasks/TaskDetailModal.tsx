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
import { Select, SelectItem } from "@heroui/select";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/api";
import { GenericId as Id } from "convex/values";
import { TaskStatusBadge } from "./TaskStatusBadge";
import { SubtaskList } from "./SubtaskList";
import { Textarea } from "@heroui/input";
import { Tooltip } from "@heroui/tooltip";
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
  IconVideo,
} from "@tabler/icons-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Accordion, AccordionItem } from "@heroui/accordion";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import dayjs from "@/lib/dates";

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
  const dependentTasks = useQuery(api.agentTasks.getDependentTasks, { taskId });
  const users = useQuery(api.users.listAll);
  const startExecution = useMutation(api.agentTasks.startExecution);
  const updateTask = useMutation(api.agentTasks.update);
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
  const [showChangesPanel, setShowChangesPanel] = useState(false);
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

  const hasActiveRun = runs?.some(
    (r) => r.status === "queued" || r.status === "running",
  );

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

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size={showChangesPanel ? "5xl" : "3xl"}
        backdrop="blur"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              {task?.taskNumber && (
                <span className="text-default-400 font-mono">
                  #{task.taskNumber}
                </span>
              )}
              <span>{task?.title}</span>
            </div>
          </ModalHeader>
          <ModalBody className="pb-6">
            <div
              className={`grid gap-6 min-h-[400px] ${showChangesPanel ? "grid-cols-[1fr_200px_1fr]" : "grid-cols-[1fr_200px]"}`}
            >
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
                        <h4 className="text-sm font-medium text-default-700 mb-2">
                          Description
                        </h4>
                        <p className="text-sm text-default-600 whitespace-pre-wrap">
                          {mainDesc}
                        </p>
                        {elementDetails && (
                          <Accordion
                            isCompact
                            variant="light"
                            className="mt-2 px-0"
                          >
                            <AccordionItem
                              key="element-details"
                              title={
                                <span className="text-xs text-default-500">
                                  Element Details
                                </span>
                              }
                            >
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
                            </AccordionItem>
                          </Accordion>
                        )}
                      </div>
                    );
                  })()}

                {subtasks && subtasks.length > 0 && (
                  <div className="border-t border-divider pt-4">
                    <SubtaskList taskId={taskId} readOnly={status !== "todo"} />
                  </div>
                )}

                {runs && runs.length > 0 && (
                  <div className="border-t border-divider pt-4">
                    <h4 className="text-sm font-medium text-default-700 mb-3 flex items-center gap-2">
                      <IconTerminal2 size={16} />
                      Agent Runs ({runs.length})
                    </h4>
                    <Accordion
                      isCompact
                      variant="splitted"
                      selectionMode="multiple"
                    >
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
                                  ? dayjs(run.startedAt).format(
                                      "M/D/YYYY, h:mm:ss A",
                                    )
                                  : "Queued"}
                              </span>
                            </div>
                          }
                        >
                          <div className="space-y-2">
                            {run.resultSummary && (
                              <p className="text-sm text-default-600">
                                {run.resultSummary}
                              </p>
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
                                <p className="text-xs text-default-400 mb-1">
                                  Logs
                                </p>
                                <div className="bg-default-100 rounded p-2 max-h-60 overflow-y-auto scrollbar font-mono text-xs space-y-1">
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
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                )}

                {showProofSection && (
                  <div className="border-t border-divider pt-4">
                    <h4 className="text-sm font-medium text-default-700 mb-3 flex items-center gap-1.5">
                      <IconPhoto size={14} />
                      Proof of Completion
                    </h4>
                    {proofs && proofs.length > 0 && (
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        {proofs.map((proof) => (
                          <div
                            key={proof._id}
                            className="group relative rounded-lg overflow-hidden bg-default-100"
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
                              <span className="text-xs text-default-500 truncate">
                                {proof.fileName}
                              </span>
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                className="opacity-0 group-hover:opacity-100"
                                onPress={() => removeProof({ id: proof._id })}
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
                      variant="flat"
                      startContent={<IconUpload size={14} />}
                      onPress={() => fileInputRef.current?.click()}
                      isLoading={isUploading}
                    >
                      Upload Proof
                    </Button>
                  </div>
                )}
              </div>

              <div className="border-l border-divider pl-4 space-y-4">
                <div>
                  <p className="text-xs text-default-400 mb-1.5">Status</p>
                  {status && <TaskStatusBadge status={status} />}
                  {isBlocked && (
                    <Chip
                      size="sm"
                      color="warning"
                      variant="flat"
                      className="ml-1.5"
                    >
                      Blocked
                    </Chip>
                  )}
                </div>
                <div>
                  <p className="text-xs text-default-400 mb-1.5">
                    Assignee
                  </p>
                  <Select
                    placeholder="Unassigned"
                    selectedKeys={task?.assignedTo ? [task.assignedTo] : []}
                    onSelectionChange={(keys) => {
                      const selected = Array.from(keys)[0];
                      const user = users?.find(
                        (u) => u._id === String(selected),
                      );
                      updateTask({ id: taskId, assignedTo: user?._id });
                    }}
                    size="sm"
                    aria-label="Assigned To"
                  >
                    {(users ?? []).map((user) => (
                      <SelectItem key={user._id}>
                        {user.fullName ||
                          [user.firstName, user.lastName]
                            .filter(Boolean)
                            .join(" ") ||
                          "Unnamed User"}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
                {latestPrUrl && (
                  <div>
                    <p className="text-xs text-default-400 mb-1.5">
                      Pull Request
                    </p>
                    <a
                      href={latestPrUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-primary-500 hover:underline"
                    >
                      <IconGitPullRequest size={14} />
                      View PR
                    </a>
                  </div>
                )}
              </div>

              {showChangesPanel && (
                <div className="flex flex-col border-l border-divider pl-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-default-700">
                      Ask Eva to make changes{" "}
                      {comments &&
                        comments.length > 0 &&
                        `(${comments.length})`}
                    </h4>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => setShowChangesPanel(false)}
                    >
                      <IconX size={16} />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-y-auto scrollbar space-y-3 mb-3">
                    {(!comments || comments.length === 0) && (
                      <p className="text-sm text-default-400">
                        No change requests yet.
                      </p>
                    )}
                    {comments?.map((comment) => (
                      <div
                        key={comment._id}
                        className="group rounded-lg bg-default-100 p-3"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-default-400">
                            {dayjs(comment.createdAt).fromNow()}
                          </span>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            className="opacity-0 group-hover:opacity-100"
                            onPress={() => removeComment({ id: comment._id })}
                          >
                            <IconTrash size={14} />
                          </Button>
                        </div>
                        <p className="text-sm text-default-600 whitespace-pre-wrap">
                          {comment.content}
                        </p>
                      </div>
                    ))}
                    <div ref={commentsEndRef} />
                  </div>
                  <form
                    onSubmit={handleAddComment}
                    className="flex gap-2 items-center bg-white dark:bg-neutral-800 rounded-lg"
                  >
                    <Textarea
                      minRows={2}
                      maxRows={5}
                      placeholder="Describe the changes you'd like Eva to make..."
                      value={commentText}
                      onValueChange={setCommentText}
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComment(e);
                        }
                      }}
                    />
                    <Button
                      isIconOnly
                      type="submit"
                      className="mb-auto mt-2 mr-2"
                      color="primary"
                      isDisabled={!commentText.trim()}
                    >
                      <IconArrowUp size={18} />
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter className="justify-between">
            <Tooltip
              content="Only the task owner can delete"
              isDisabled={isOwner}
            >
              <div>
                <Button
                  color="danger"
                  variant="flat"
                  startContent={<IconTrash size={18} />}
                  onPress={() => setShowDeleteConfirm(true)}
                  isDisabled={!isOwner}
                >
                  Delete
                </Button>
              </div>
            </Tooltip>
            <div className="flex items-center gap-2">
              {!showChangesPanel &&
                status !== "todo" &&
                status !== "in_progress" && (
                  <Button
                    variant="flat"
                    startContent={<IconMessagePlus size={18} />}
                    onPress={() => setShowChangesPanel(true)}
                  >
                    Request Changes
                  </Button>
                )}
              {status === "todo" ? (
                <Tooltip
                  content="Only the task owner can run Eva"
                  isDisabled={isOwner}
                >
                  <div>
                    <Button
                      color="primary"
                      startContent={<IconPlayerPlay size={18} />}
                      onPress={handleStartExecution}
                      isLoading={isStarting}
                      isDisabled={isBlocked || hasActiveRun || !isOwner}
                    >
                      {hasActiveRun ? "Running..." : "Run Eva"}
                    </Button>
                  </div>
                </Tooltip>
              ) : latestPrUrl &&
                (status === "code_review" || status === "done") ? (
                <Button
                  color="primary"
                  startContent={<IconGitPullRequest size={18} />}
                  as="a"
                  href={latestPrUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open PR
                </Button>
              ) : null}
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        size="md"
      >
        <ModalContent>
          <ModalHeader>Delete Task</ModalHeader>
          <ModalBody>
            <p className="text-default-600">
              Are you sure you want to delete{" "}
              <strong>
                {task?.taskNumber ? `#${task.taskNumber} ` : ""}
                {task?.title}
              </strong>
              ?
            </p>
            {dependentTasks && dependentTasks.length > 0 && (
              <div className="mt-3 p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
                <p className="text-sm font-medium text-warning-700 dark:text-warning-300 mb-2">
                  The following tasks depend on this task and will also be
                  deleted:
                </p>
                <ul className="text-sm text-warning-600 dark:text-warning-400 space-y-1">
                  {dependentTasks.map((t) => (
                    <li key={t._id}>
                      {t.taskNumber ? `#${t.taskNumber} ` : ""}
                      {t.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-sm text-default-500 mt-3">
              This action cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button
              color="danger"
              onPress={handleDelete}
              isLoading={isDeleting}
            >
              Delete
              {dependentTasks && dependentTasks.length > 0
                ? ` ${dependentTasks.length + 1} Tasks`
                : ""}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
