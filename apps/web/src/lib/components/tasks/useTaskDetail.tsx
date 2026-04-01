"use client";

import { useElapsedSeconds } from "@conductor/ui";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useEffect, useState } from "react";
import type { TaskDetailTab } from "./_components/task-detail-constants";

export function useTaskDetail(taskId: Id<"agentTasks">) {
  const taskResult = useQuery(api.agentTasks.get, { id: taskId });
  const task = taskResult ?? undefined;
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
  const hasEnabledAuditCategories =
    useQuery(
      api.auditCategories.hasEnabledCategories,
      task?.repoId ? { repoId: task.repoId } : "skip",
    ) ?? true;
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
  const auditElapsed = useElapsedSeconds(
    latestAudit?.createdAt,
    latestAudit?.status === "running",
  );
  const fixElapsed = useElapsedSeconds(
    latestAudit?.fixStatus === "fixing" ? latestAudit.createdAt : undefined,
    latestAudit?.fixStatus === "fixing",
  );
  const users = useQuery(api.users.listAll);
  const projects = useQuery(
    api.projects.list,
    task?.repoId ? { repoId: task.repoId } : "skip",
  );
  const allComments = useQuery(api.taskComments.listByTask, { taskId });
  const comments = allComments?.filter((c) => c.authorId);
  const auditCategories = useQuery(
    api.auditCategories.listByRepo,
    task?.repoId ? { repoId: task.repoId } : "skip",
  );
  const enabledAuditCount =
    auditCategories?.filter((c) => c.enabled).length ?? 0;
  const proofs = useQuery(api.taskProof.listByTask, { taskId });

  const startExecution = useMutation(api.agentTasks.startExecution);
  const cancelExecution = useMutation(api.taskWorkflow.cancelExecution);

  const [baseBranch, setBaseBranch] = useState("main");
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [showResolveConfirm, setShowResolveConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<TaskDetailTab>("activity");
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [requestingChanges, setRequestingChanges] = useState(false);

  useEffect(() => {
    setBaseBranch(task?.baseBranch ?? "main");
  }, [task?.baseBranch]);

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

  const status = task?.status;
  const showProofSection = status !== undefined && status !== "todo";
  const canEditTaskText = status === "todo" && !hasActiveRun;
  const latestPrUrl = runs?.find((r) => r.prUrl)?.prUrl;
  const latestDeployment = runs?.find((r) => r.deploymentStatus);
  const modalWidthClass = "max-w-[calc(100vw-2rem)] md:max-w-[72rem]";
  const layoutGridClass = "grid-cols-1 md:grid-cols-[1fr_1fr_200px]";
  const hasTabContent =
    (runs !== undefined && runs.length > 0) ||
    (proofs !== undefined && proofs.length > 0) ||
    latestAudit !== null ||
    (comments !== undefined && comments.length > 0);
  const showTabsColumn = status !== "todo" || hasTabContent;

  return {
    isLoading: task === undefined,

    task,
    status,
    runs,
    allAudits,
    latestAudit,
    pastAudits,
    comments,
    proofs,
    users,
    projects,
    streaming,
    auditStreaming,

    isOwner,
    isBlocked,
    hasActiveRun: Boolean(hasActiveRun),
    canEditTaskText,
    showProofSection,
    showTabsColumn,
    hasEnabledAuditCategories,
    isActivityBusy:
      Boolean(hasActiveRun) ||
      latestAudit?.status === "running" ||
      latestAudit?.fixStatus === "fixing",
    isProofBusy: status === "in_progress",
    isAuditBusy:
      latestAudit?.status === "running" || latestAudit?.fixStatus === "fixing",

    activeRun,
    activeRunElapsed,
    auditElapsed,
    fixElapsed,
    latestPrUrl,
    latestDeployment,
    enabledAuditCount,

    activeTab,
    setActiveTab,
    baseBranch,
    setBaseBranch,
    requestingChanges,
    setRequestingChanges,
    executionError,
    setExecutionError,
    showStopConfirm,
    setShowStopConfirm,
    showResolveConfirm,
    setShowResolveConfirm,
    isStarting,
    isStopping,

    handleStartExecution,
    handleStopExecution,
    handleResolveConflicts,

    layoutGridClass,
    modalWidthClass,
  };
}

export type TaskDetailData = ReturnType<typeof useTaskDetail>;
