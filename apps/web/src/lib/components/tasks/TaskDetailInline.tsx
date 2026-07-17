"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import type { Id } from "@conductor/backend";
import { Badge } from "@conductor/ui";
import { IconLoader2, IconClock } from "@tabler/icons-react";
import dayjs from "@conductor/shared/dates";
import { UserInitials } from "@conductor/shared";
import { useTaskDetail } from "./useTaskDetail";
import { getUserDisplayName } from "./_components/task-detail-constants";
import { TaskHeader } from "./_components/TaskHeader";
import { TaskDescription } from "./_components/TaskDescription";
import { ActivityTimeline } from "./_components/ActivityTimeline";
import { TaskSubscribers } from "./_components/TaskSubscribers";
import { TaskReactionsProvider } from "./_components/TaskReactionsProvider";
import { StatusFieldsSection } from "./_components/StatusFieldsSection";
import { TaskFooter } from "./_components/TaskFooter";
import { StopConfirmDialog } from "./_components/StopConfirmDialog";
import { ResolveConfirmDialog } from "./_components/ResolveConfirmDialog";
import { StartupCommandsConfirmDialog } from "./_components/StartupCommandsConfirmDialog";
import { RunDevServerConfirmDialog } from "./_components/RunDevServerConfirmDialog";
import { TaskSandboxPanel } from "./TaskSandboxPanel";
import { TaskSandboxChatPanel } from "./TaskSandboxChatPanel";
import { ResizablePanelLayout } from "@/lib/components/ResizablePanelLayout";
import type { SandboxTab, TaskRouteSandboxTab } from "@/lib/search-params";
import type { UseTaskDetailRouting } from "./useTaskDetail";
import { useQuickTaskHeaderActionsSlot } from "@/lib/components/quick-tasks/QuickTaskHeaderActionsSlot";
import { EntityNotFound } from "@/lib/components/EntityNotFound";

interface TaskDetailInlineProps {
  onClose: () => void;
  taskId: Id<"agentTasks">;
  allTags?: string[];
  routing?: UseTaskDetailRouting;
}

export function TaskDetailInline({
  taskId,
  allTags = [],
  routing,
}: TaskDetailInlineProps) {
  const [embeddedSandboxTab, setEmbeddedSandboxTab] =
    useState<SandboxTab>("preview");
  const quickTaskHeaderActionsSlot = useQuickTaskHeaderActionsSlot();

  const {
    isLoading,
    isNotFound,
    task,
    status,
    runs,
    allAudits,
    comments,
    proofs,
    taskActivity,
    users,
    creatorUser,
    projects,
    streaming,
    auditStreaming,
    isOwner,
    isBlocked,
    hasActiveRun,
    requestChangesBlockedReason,
    isProjectTask,
    hasRuns,
    canEditTaskText,
    isActivityBusy,
    activeRunElapsed,
    auditElapsed,
    fixElapsed,
    latestPrUrl,
    latestPrError,
    latestDeployment,
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
    // Sandbox preview
    canStartSandbox,
    canViewSandbox,
    showSandbox,
    isSandboxActive,
    isSandboxStarting,
    isSandboxStopping,
    handleStartSandbox,
    handleStopSandbox,
    handleToggleSandboxView,
    handleRetryStartupCommands,
    isRetryingStartupCommands,
    handleRunDevServer,
    isRunningDevServer,
    handleRunBackgroundCommands,
    isRunningBackgroundCommands,
    devServerCommandLabel,
    sandboxId,
    canCreatePr,
    isCreatingPr,
    handleCreatePr,
  } = useTaskDetail(taskId, routing);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <IconLoader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isNotFound || !task) {
    return <EntityNotFound entityLabel="task" />;
  }

  const isQuickTask = task.projectId === undefined;
  const isSandboxViewActive = showSandbox;

  const routeSandboxTab: TaskRouteSandboxTab =
    routing?.mode === "quick-sandbox" ? routing.quick.sandboxTab : "preview";
  const activeSandboxTab: SandboxTab =
    routing?.mode === "quick-sandbox" ? routeSandboxTab : embeddedSandboxTab;
  const handleSandboxTabChange = (tab: SandboxTab) => {
    if (routing?.mode === "quick-sandbox") {
      const nextTab: TaskRouteSandboxTab =
        tab === "prd" || tab === "files" ? "preview" : tab;
      routing.quick.onSandboxTabChange(nextTab);
      return;
    }
    setEmbeddedSandboxTab(tab);
  };

  // Always mount the sandbox panel when the task can have a sandbox so tabs
  // (Diffs, etc.) stay reachable while stopped — same as sessions. Panes
  // self-gate with their own inactive empty states. Tasks that never ran
  // still get the honest empty message.
  const sandboxRightPanel =
    task?.repoId && canViewSandbox ? (
      <TaskSandboxPanel
        taskId={taskId}
        sandboxId={sandboxId}
        vercelSandboxId={task.vercelSandboxId}
        isActive={isSandboxActive}
        repoId={task.repoId}
        devPort={task.devPort}
        devCommand={task.devCommand}
        terminalPanes={task.terminalPanes}
        prUrl={latestPrUrl}
        activeTab={activeSandboxTab}
        onTabChange={handleSandboxTabChange}
      />
    ) : (
      <div className="flex h-full items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-muted-foreground">
            No sandbox for this task yet — it becomes available once the task
            has run
          </p>
        </div>
      </div>
    );

  const sandboxContent = (
    <ResizablePanelLayout
      storageKey="task-sandbox-collapsed"
      leftDefaultSize="30%"
      leftMinWidthPx={350}
      rightMinWidthPx={300}
      defaultRightCollapsed={false}
      leftPanel={() => (
        <TaskSandboxChatPanel
          taskId={taskId}
          isSandboxActive={isSandboxActive}
        />
      )}
      rightPanel={sandboxRightPanel}
    />
  );

  const detailContent = (
    <TaskReactionsProvider taskId={taskId}>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden scrollbar md:overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col md:grid md:grid-cols-[14fr_6fr] md:grid-rows-1 md:overflow-hidden">
            <div className="min-h-0 min-w-0 md:flex md:flex-1 md:flex-col md:overflow-hidden">
              <div className="flex min-h-0 min-w-0 flex-col overflow-x-hidden md:flex-1 md:overflow-y-auto md:scrollbar">
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="shrink-0 space-y-4 px-4 pt-4 md:px-6 md:pr-6 md:pt-5">
                    <div>
                      <TaskHeader
                        taskNumber={task?.taskNumber}
                        title={task?.title}
                        canEditTaskText={canEditTaskText}
                        taskId={taskId}
                      />
                      <div className="flex items-center gap-2 mt-2">
                        {task?.scheduledAt ? (
                          <Badge
                            variant="outline"
                            className="gap-1 text-xs font-normal text-muted-foreground"
                          >
                            <IconClock size={11} />
                            {status === "todo"
                              ? "Scheduled for"
                              : "Was scheduled for"}{" "}
                            {dayjs(task.scheduledAt).format("DD/MM/YYYY HH:mm")}
                          </Badge>
                        ) : null}
                        {task?.createdAt ? (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
                            {creatorUser ? (
                              <>
                                <UserInitials
                                  userId={creatorUser._id}
                                  size="sm"
                                />
                                <span>{getUserDisplayName(creatorUser)}</span>
                                <span>·</span>
                              </>
                            ) : null}
                            <span>
                              {dayjs(task.createdAt).format("DD/MM/YYYY HH:mm")}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <TaskDescription
                      description={task?.description}
                      canEditTaskText={canEditTaskText}
                      taskId={taskId}
                      inline={true}
                    />

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                        Activity
                        {isActivityBusy ? (
                          <span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
                        ) : null}
                      </div>
                      <TaskSubscribers taskId={taskId} users={users} />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-col sm:mt-4">
                    <ActivityTimeline
                      taskId={taskId}
                      runs={runs}
                      allAudits={allAudits}
                      comments={comments}
                      taskActivity={taskActivity}
                      proofs={proofs}
                      users={users}
                      streaming={streaming}
                      auditStreaming={auditStreaming}
                      activeRunElapsed={activeRunElapsed}
                      auditElapsed={auditElapsed}
                      fixElapsed={fixElapsed}
                      isStopping={isStopping}
                      onStopConfirm={() => setShowStopConfirm(true)}
                      hasActiveRun={hasActiveRun}
                      requestChangesBlockedReason={requestChangesBlockedReason}
                      isProjectTask={isProjectTask}
                      hasRuns={hasRuns}
                      isOwner={isOwner}
                      requestingChanges={requestingChanges}
                      setRequestingChanges={setRequestingChanges}
                      executionError={executionError}
                      setExecutionError={setExecutionError}
                      onRequestChangesSubmitted={() => setActiveTab("activity")}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex shrink-0 flex-col min-w-0 overflow-x-hidden px-4 pb-4 md:mt-0 md:overflow-hidden md:px-0 md:pb-0 md:pl-8 md:pr-6 md:pt-5">
              <StatusFieldsSection
                taskId={taskId}
                task={task}
                status={status}
                isBlocked={isBlocked}
                users={users}
                projects={projects}
                baseBranch={baseBranch}
                setBaseBranch={setBaseBranch}
                latestDeployment={latestDeployment}
                hasActiveRun={hasActiveRun}
                allTags={allTags}
                requestingChanges={requestingChanges}
              />
            </div>
          </div>
        </div>
      </div>
    </TaskReactionsProvider>
  );

  const quickTaskHeaderActions =
    isQuickTask && quickTaskHeaderActionsSlot?.slotElement ? (
      <TaskFooter
        variant="header"
        taskId={taskId}
        task={task}
        status={status}
        hasActiveRun={hasActiveRun}
        latestPrUrl={latestPrUrl}
        latestPrError={latestPrError}
        latestDeployment={latestDeployment}
        executionError={executionError}
        isStarting={isStarting}
        canStartSandbox={canStartSandbox}
        canViewSandbox={canViewSandbox}
        isSandboxActive={isSandboxActive}
        isSandboxStarting={isSandboxStarting}
        isSandboxStopping={isSandboxStopping}
        isRetryingStartupCommands={isRetryingStartupCommands}
        canCreatePr={canCreatePr}
        isCreatingPr={isCreatingPr}
        onCreatePr={handleCreatePr}
        onViewSandbox={handleToggleSandboxView}
        onStopSandbox={handleStopSandbox}
        isSandboxViewActive={isSandboxViewActive}
        onRunStartupCommands={() => setShowStartupCommandsConfirm(true)}
        onRunDevServer={() => setShowRunDevServerConfirm(true)}
        isRunningDevServer={isRunningDevServer}
        onRunBackgroundCommands={handleRunBackgroundCommands}
        isRunningBackgroundCommands={isRunningBackgroundCommands}
        onStartExecution={handleStartExecution}
        onResolveConfirm={() => setShowResolveConfirm(true)}
        onRequestChanges={() => {
          setRequestingChanges(true);
          if (executionError) setExecutionError(null);
        }}
      />
    ) : null;

  return (
    <>
      {quickTaskHeaderActions && quickTaskHeaderActionsSlot?.slotElement
        ? createPortal(
            quickTaskHeaderActions,
            quickTaskHeaderActionsSlot.slotElement,
          )
        : null}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {isSandboxViewActive ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {sandboxContent}
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {detailContent}
          </div>
        )}
      </div>
      <StopConfirmDialog
        open={showStopConfirm}
        onOpenChange={setShowStopConfirm}
        onConfirm={handleStopExecution}
        isStopping={isStopping}
      />
      <ResolveConfirmDialog
        open={showResolveConfirm}
        onOpenChange={setShowResolveConfirm}
        onConfirm={handleResolveConflicts}
        isStarting={isStarting}
      />
      <StartupCommandsConfirmDialog
        open={showStartupCommandsConfirm}
        onOpenChange={setShowStartupCommandsConfirm}
        onConfirm={handleRetryStartupCommands}
        isStarting={isRetryingStartupCommands}
      />
      <RunDevServerConfirmDialog
        open={showRunDevServerConfirm}
        onOpenChange={setShowRunDevServerConfirm}
        onConfirm={handleRunDevServer}
        isRunning={isRunningDevServer}
        devCommandLabel={devServerCommandLabel}
      />
    </>
  );
}
