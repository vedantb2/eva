"use client";

import { useElapsedSeconds } from "@conductor/ui";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useAction, useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { FALLBACK_GIT_BASE_BRANCH } from "@conductor/shared";
import { useEffect, useState, useCallback } from "react";
import type { TaskRouteSandboxTab } from "@/lib/search-params";
import type { TaskDetailTab } from "./_components/task-detail-constants";

const PREVIEW_SANDBOX_ALLOWED_STATUSES = [
  "code_review",
  "business_review",
  "done",
];

export type QuickTaskDetailRouting = {
  detailTab: TaskDetailTab;
  onDetailTabChange: (tab: TaskDetailTab) => void;
  onOpenSandboxView: (sandboxTab: TaskRouteSandboxTab) => void;
};

export type QuickTaskSandboxRouting = {
  sandboxTab: TaskRouteSandboxTab;
  onSandboxTabChange: (tab: TaskRouteSandboxTab) => void;
  onExitSandboxView: () => void;
};

export type ProjectTaskDetailRouting = {
  detailTab: TaskDetailTab;
  onDetailTabChange: (tab: TaskDetailTab) => void;
};

export type UseTaskDetailRouting =
  | { mode: "quick-detail"; quick: QuickTaskDetailRouting }
  | { mode: "quick-sandbox"; quick: QuickTaskSandboxRouting }
  | { mode: "project-detail"; project: ProjectTaskDetailRouting };

export function useTaskDetail(
  taskId: Id<"agentTasks">,
  routing?: UseTaskDetailRouting,
) {
  const taskResult = useQuery(api.agentTasks.get, { id: taskId });
  const task = taskResult ?? undefined;
  const currentUserId = useQuery(api.auth.me);
  const isOwner = currentUserId === task?.createdBy;
  const isBlocked = useQuery(api.taskDependencies.isBlocked, { taskId });
  const runs = useQuery(api.agentRuns.listByTask, { taskId });
  const hasActiveRun = runs?.some(
    (run) => run.status === "queued" || run.status === "running",
  );
  const hasRuns = (runs?.length ?? 0) > 0;
  const isProjectTask = task?.projectId !== undefined;
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
  const sandboxEvents = useQuery(api.taskSandboxEvents.listByTask, { taskId });
  const taskActivity = useQuery(api.taskActivity.listByTask, { taskId });
  const repoForTask = useQuery(
    api.githubRepos.get,
    task?.repoId ? { id: task.repoId } : "skip",
  );

  const startExecution = useMutation(api.agentTasks.startExecution);
  const cancelExecution = useMutation(api.taskWorkflow.cancelExecution);
  const startTaskSandboxMutation = useMutation(api.agentTasks.startTaskSandbox);
  const stopTaskSandboxMutation = useMutation(api.agentTasks.stopTaskSandbox);
  const retryStartupCommandsMutation = useMutation(
    api.agentTasks.retryStartupCommands,
  );
  const runDevServerMutation = useMutation(api.agentTasks.runDevServer);
  const createTaskPrAction = useAction(api.taskWorkflowActions.createTaskPr);

  const [baseBranch, setBaseBranch] = useState(FALLBACK_GIT_BASE_BRANCH);
  const [embeddedShowSandbox, setEmbeddedShowSandbox] = useState(false);
  const [isSandboxStarting, setIsSandboxStarting] = useState(false);
  const [isSandboxStopping, setIsSandboxStopping] = useState(false);
  const [isRetryingStartupCommands, setIsRetryingStartupCommands] =
    useState(false);
  const [isRunningDevServer, setIsRunningDevServer] = useState(false);
  const [showRunDevServerConfirm, setShowRunDevServerConfirm] = useState(false);
  const [isCreatingPr, setIsCreatingPr] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [showResolveConfirm, setShowResolveConfirm] = useState(false);
  const [showStartupCommandsConfirm, setShowStartupCommandsConfirm] =
    useState(false);
  const [internalActiveTab, setInternalActiveTab] =
    useState<TaskDetailTab>("activity");
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [requestingChanges, setRequestingChanges] = useState(false);

  const activeTab: TaskDetailTab =
    routing?.mode === "quick-detail"
      ? routing.quick.detailTab
      : routing?.mode === "project-detail"
        ? routing.project.detailTab
        : internalActiveTab;

  const setActiveTab = useCallback(
    (tab: TaskDetailTab) => {
      if (routing?.mode === "quick-detail") {
        routing.quick.onDetailTabChange(tab);
      } else if (routing?.mode === "project-detail") {
        routing.project.onDetailTabChange(tab);
      } else {
        setInternalActiveTab(tab);
      }
    },
    [routing],
  );

  const showSandbox =
    routing?.mode === "quick-sandbox"
      ? true
      : routing?.mode === "quick-detail"
        ? false
        : embeddedShowSandbox;

  useEffect(() => {
    const fromTask = task?.baseBranch?.trim();
    if (fromTask) {
      setBaseBranch(fromTask);
      return;
    }
    const fromRepo = repoForTask?.defaultBaseBranch?.trim();
    setBaseBranch(fromRepo || FALLBACK_GIT_BASE_BRANCH);
  }, [task?.baseBranch, repoForTask?.defaultBaseBranch]);

  const handleStartExecution = async () => {
    setIsStarting(true);
    try {
      await startExecution({ id: taskId });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start execution";
      setExecutionError(message);
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

  const canStartSandbox =
    task?.status !== undefined &&
    PREVIEW_SANDBOX_ALLOWED_STATUSES.includes(task.status);

  const isSandboxActive = task?.reviewTaskSandboxStatus === "active";
  const isSandboxStartingFromStatus =
    task?.reviewTaskSandboxStatus === "starting";
  const isSandboxStoppingFromStatus =
    task?.reviewTaskSandboxStatus === "stopping";
  const hasReviewSandbox = task?.sandboxId !== undefined;
  const canViewSandbox =
    canStartSandbox ||
    hasReviewSandbox ||
    isSandboxActive ||
    isSandboxStartingFromStatus ||
    isSandboxStoppingFromStatus;
  const sandboxStartupStreaming = useQuery(
    api.streaming.get,
    isSandboxStartingFromStatus
      ? { entityId: `task-sandbox-startup-${taskId}` }
      : "skip",
  );

  const openSandboxAfterStart = useCallback(() => {
    if (routing?.mode === "quick-detail") {
      routing.quick.onOpenSandboxView("preview");
    } else {
      setEmbeddedShowSandbox(true);
    }
  }, [routing]);

  const handleStartSandbox = useCallback(async () => {
    setIsSandboxStarting(true);
    try {
      await startTaskSandboxMutation({ taskId });
      openSandboxAfterStart();
    } catch (err) {
      console.error("Failed to start sandbox:", err);
    } finally {
      setIsSandboxStarting(false);
    }
  }, [startTaskSandboxMutation, taskId, openSandboxAfterStart]);

  const handleStopSandbox = useCallback(async () => {
    setIsSandboxStopping(true);
    try {
      await stopTaskSandboxMutation({ taskId });
    } catch (err) {
      console.error("Failed to stop sandbox:", err);
    } finally {
      setIsSandboxStopping(false);
    }
  }, [stopTaskSandboxMutation, taskId]);

  const handleRetryStartupCommands = useCallback(async () => {
    setIsRetryingStartupCommands(true);
    try {
      await retryStartupCommandsMutation({ taskId });
      openSandboxAfterStart();
    } catch (err) {
      console.error("Failed to retry startup commands:", err);
    } finally {
      setIsRetryingStartupCommands(false);
    }
  }, [retryStartupCommandsMutation, taskId, openSandboxAfterStart]);

  const handleRunDevServer = useCallback(async () => {
    setIsRunningDevServer(true);
    try {
      await runDevServerMutation({ taskId });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to run dev server";
      setExecutionError(message);
    } finally {
      setIsRunningDevServer(false);
    }
  }, [runDevServerMutation, taskId, setExecutionError]);

  const devServerCommandLabel = (() => {
    const fromTask = task?.devCommand?.trim();
    if (fromTask) return fromTask;
    const fromRepo = repoForTask?.devCommand?.trim();
    if (fromRepo) return fromRepo;
    return "Auto-detected from package.json (e.g. pnpm run dev)";
  })();

  const handleCreatePr = useCallback(async () => {
    setIsCreatingPr(true);
    try {
      await createTaskPrAction({ taskId });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create PR";
      setExecutionError(message);
    } finally {
      setIsCreatingPr(false);
    }
  }, [createTaskPrAction, taskId]);

  const handleToggleSandboxView = useCallback(() => {
    if (routing?.mode === "quick-sandbox") {
      routing.quick.onExitSandboxView();
      return;
    }
    if (routing?.mode === "quick-detail") {
      routing.quick.onOpenSandboxView("preview");
      return;
    }
    setEmbeddedShowSandbox((prev) => !prev);
  }, [routing]);

  const status = task?.status;
  const isRunWrappingUp =
    status === "in_progress" && hasActiveRun !== true && hasRuns;
  const requestChangesBlockedReason: string | undefined = hasActiveRun
    ? "Wait for the current run to finish"
    : isRunWrappingUp
      ? "Wait for the previous run to finish wrapping up"
      : !hasRuns
        ? "Run Eva on this task before requesting changes"
        : undefined;
  const showProofSection = status !== undefined && status !== "todo";
  const canEditTaskText = status === "todo" && !hasActiveRun;
  const latestPrUrl = runs?.find((r) => r.prUrl)?.prUrl;
  const latestPrError = runs?.find((r) => r.prError)?.prError;
  const latestDeployment = runs?.find((r) => r.deploymentStatus);
  const canCreatePr = !latestPrUrl && (runs?.length ?? 0) > 0 && !hasActiveRun;
  const modalWidthClass = "max-w-[calc(100vw-2rem)] md:max-w-[72rem]";
  const layoutGridClass = "grid-cols-1 md:grid-cols-[1fr_1fr_200px]";
  const hasTabContent =
    (runs !== undefined && runs.length > 0) ||
    (proofs !== undefined && proofs.length > 0) ||
    latestAudit !== null ||
    (comments !== undefined && comments.length > 0);
  const showTabsColumn = status !== "todo" || hasTabContent;
  const creatorUser = task?.createdBy
    ? users?.find((u) => u._id === task.createdBy)
    : undefined;

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
    sandboxEvents,
    taskActivity,
    users,
    creatorUser,
    projects,
    streaming,
    auditStreaming,

    isOwner,
    isBlocked,
    hasActiveRun: Boolean(hasActiveRun),
    isProjectTask,
    requestChangesBlockedReason,
    hasRuns,
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
    latestPrError,
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
    showStartupCommandsConfirm,
    setShowStartupCommandsConfirm,
    showRunDevServerConfirm,
    setShowRunDevServerConfirm,
    isStarting,
    isStopping,

    handleStartExecution,
    handleStopExecution,
    handleResolveConflicts,

    canStartSandbox,
    canViewSandbox,
    showSandbox,
    isSandboxActive,
    isSandboxStarting: isSandboxStarting || isSandboxStartingFromStatus,
    sandboxStartupActivity: sandboxStartupStreaming?.currentActivity,
    isSandboxStopping: isSandboxStopping || isSandboxStoppingFromStatus,
    handleStartSandbox,
    handleStopSandbox,
    handleToggleSandboxView,
    handleRetryStartupCommands,
    isRetryingStartupCommands,
    handleRunDevServer,
    isRunningDevServer,
    devServerCommandLabel,
    sandboxId: task?.sandboxId,
    reviewTaskSandboxStatus: task?.reviewTaskSandboxStatus,

    canCreatePr,
    isCreatingPr,
    handleCreatePr,

    layoutGridClass,
    modalWidthClass,
  };
}

export type TaskDetailData = ReturnType<typeof useTaskDetail>;
