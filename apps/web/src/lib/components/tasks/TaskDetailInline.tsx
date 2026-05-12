"use client";

import { useState } from "react";
import type { Id } from "@conductor/backend";
import {
  Badge,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@conductor/ui";
import {
  IconTerminal2,
  IconPhoto,
  IconShieldCheck,
  IconMessagePlus,
  IconLoader2,
  IconClock,
  IconPlayerStop,
  IconArrowLeft,
} from "@tabler/icons-react";
import dayjs from "@conductor/shared/dates";
import { useTaskDetail } from "./useTaskDetail";
import { isTaskDetailTab } from "./_components/task-detail-constants";
import { TaskHeader } from "./_components/TaskHeader";
import { TaskDescription } from "./_components/TaskDescription";
import { ActivityTimeline } from "./_components/ActivityTimeline";
import { ProofSection } from "./_components/ProofSection";
import { AuditSection } from "./_components/AuditSection";
import { CommentsSection } from "./_components/CommentsSection";
import { StatusFieldsSection } from "./_components/StatusFieldsSection";
import { TaskFooter } from "./_components/TaskFooter";
import { StopConfirmDialog } from "./_components/StopConfirmDialog";
import { ResolveConfirmDialog } from "./_components/ResolveConfirmDialog";
import { TaskSandboxPanel } from "./TaskSandboxPanel";
import { StreamingActivityDisplay } from "@/lib/components/StreamingActivityDisplay";
import type { SandboxTab } from "@/lib/search-params";
import type { UseTaskDetailRouting } from "./useTaskDetail";

interface TaskDetailInlineProps {
  onClose: () => void;
  taskId: Id<"agentTasks">;
  allTags?: string[];
  routing?: Extract<UseTaskDetailRouting, { mode: "quick-detail" }>;
}

export function TaskDetailInline({
  taskId,
  allTags = [],
  routing,
}: TaskDetailInlineProps) {
  const [embeddedSandboxTab, setEmbeddedSandboxTab] =
    useState<SandboxTab>("preview");

  const {
    isLoading,
    task,
    status,
    runs,
    allAudits,
    latestAudit,
    pastAudits,
    comments,
    proofs,
    sandboxEvents,
    users,
    projects,
    streaming,
    auditStreaming,
    isOwner,
    isBlocked,
    hasActiveRun,
    canEditTaskText,
    showProofSection,
    isActivityBusy,
    isProofBusy,
    isAuditBusy,
    activeRunElapsed,
    auditElapsed,
    fixElapsed,
    latestPrUrl,
    latestPrError,
    latestDeployment,
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
    // Sandbox preview
    canStartSandbox,
    showSandbox,
    isSandboxActive,
    isSandboxStarting,
    isSandboxStopping,
    handleStartSandbox,
    handleStopSandbox,
    handleToggleSandboxView,
    handleRetryStartupCommands,
    isRetryingStartupCommands,
    sandboxId,
    sandboxStartupActivity,
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

  // Show sandbox panel while the sandbox lifecycle is in progress.
  if (
    showSandbox &&
    (isSandboxActive || isSandboxStarting || isSandboxStopping)
  ) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Sandbox header with back button and stop controls */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleSandboxView}
            className="gap-1.5"
          >
            <IconArrowLeft size={16} />
            Back to Details
          </Button>
          <div className="flex items-center gap-2">
            {isSandboxStarting && !isSandboxActive ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <IconLoader2 size={16} className="animate-spin" />
                Starting sandbox...
              </div>
            ) : null}
            {isSandboxStopping ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <IconLoader2 size={16} className="animate-spin" />
                Stopping sandbox...
              </div>
            ) : null}
            {isSandboxActive ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleStopSandbox}
                disabled={isSandboxStopping}
                className="gap-1.5"
              >
                {isSandboxStopping ? (
                  <IconLoader2 size={14} className="animate-spin" />
                ) : (
                  <IconPlayerStop size={14} />
                )}
                {isSandboxStopping ? "Stopping..." : "Stop Sandbox"}
              </Button>
            ) : null}
          </div>
        </div>
        {/* Sandbox panel */}
        <div className="flex-1 min-h-0">
          {isSandboxActive && sandboxId && task?.repoId ? (
            <TaskSandboxPanel
              taskId={taskId}
              sandboxId={sandboxId}
              isActive={isSandboxActive}
              repoId={task.repoId}
              devPort={task.devPort}
              devCommand={task.devCommand}
              terminalPanes={task.terminalPanes}
              activeTab={embeddedSandboxTab}
              onTabChange={setEmbeddedSandboxTab}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="w-full max-w-md px-4">
                <StreamingActivityDisplay
                  activity={sandboxStartupActivity}
                  thinkingLabel={
                    isSandboxStopping
                      ? "Stopping sandbox..."
                      : "Starting sandbox..."
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        <div className="px-4 md:px-6 pt-4 md:pt-5 flex-1 min-h-0 overflow-y-auto scrollbar">
          <div className="flex flex-col pb-4">
            <div className="flex flex-col md:grid md:grid-rows-1 md:grid-cols-[14fr_6fr] min-h-0">
              <div className="space-y-4 min-h-0 min-w-0 md:pr-6">
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
                      <span className="text-xs text-muted-foreground ml-auto">
                        {dayjs(task.createdAt).format("DD/MM/YYYY HH:mm")}
                      </span>
                    ) : null}
                  </div>
                </div>
                <TaskDescription
                  description={task?.description}
                  canEditTaskText={canEditTaskText}
                  taskId={taskId}
                  inline={true}
                />

                <Tabs
                  value={activeTab}
                  onValueChange={(v) => {
                    if (isTaskDetailTab(v)) {
                      setActiveTab(v);
                    }
                  }}
                >
                  <TabsList className="w-full justify-start overflow-x-auto sticky top-0 z-10 bg-background">
                    <TabsTrigger
                      value="activity"
                      className="gap-1 sm:gap-1.5 text-xs sm:text-sm min-h-[36px]"
                    >
                      <IconTerminal2 size={14} />
                      <span className="hidden sm:inline">Activity</span>
                      <span className="sm:hidden">Runs</span>
                      {isActivityBusy && (
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                      )}
                    </TabsTrigger>
                    <TabsTrigger
                      value="proof"
                      className="gap-1 sm:gap-1.5 text-xs sm:text-sm min-h-[36px]"
                    >
                      <IconPhoto size={14} />
                      Proof
                      {isProofBusy && (
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                      )}
                    </TabsTrigger>
                    <TabsTrigger
                      value="audit"
                      className="gap-1 sm:gap-1.5 text-xs sm:text-sm min-h-[36px]"
                    >
                      <IconShieldCheck size={14} />
                      Audit
                      {isAuditBusy && (
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                      )}
                    </TabsTrigger>
                    <TabsTrigger
                      value="comments"
                      className="gap-1 sm:gap-1.5 text-xs sm:text-sm min-h-[36px]"
                    >
                      <IconMessagePlus size={14} />
                      <span className="hidden sm:inline">Comments</span>
                      <span className="sm:hidden">Chat</span>
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="activity" className="mt-3 sm:mt-4">
                    <ActivityTimeline
                      runs={runs}
                      allAudits={allAudits}
                      comments={comments}
                      sandboxEvents={sandboxEvents}
                      streaming={streaming}
                      auditStreaming={auditStreaming}
                      activeRunElapsed={activeRunElapsed}
                      auditElapsed={auditElapsed}
                      fixElapsed={fixElapsed}
                      isStopping={isStopping}
                      onStopConfirm={() => setShowStopConfirm(true)}
                    />
                  </TabsContent>
                  <TabsContent value="proof" className="mt-3 sm:mt-4">
                    {showProofSection ? (
                      <ProofSection
                        proofs={proofs}
                        status={status}
                        isQuickTask={task?.projectId === undefined}
                      />
                    ) : null}
                  </TabsContent>
                  <TabsContent value="audit" className="mt-3 sm:mt-4">
                    <AuditSection
                      latestAudit={latestAudit}
                      pastAudits={pastAudits}
                    />
                  </TabsContent>
                  <TabsContent value="comments" className="mt-3 sm:mt-4">
                    <CommentsSection
                      taskId={taskId}
                      comments={comments}
                      status={status}
                      hasActiveRun={hasActiveRun}
                      isOwner={isOwner}
                      requestingChanges={requestingChanges}
                      setRequestingChanges={setRequestingChanges}
                      executionError={executionError}
                      setExecutionError={setExecutionError}
                      onRequestChangesSubmitted={() => setActiveTab("activity")}
                    />
                  </TabsContent>
                </Tabs>
              </div>
              <div className="md:pl-8 flex flex-col min-h-0 min-w-0 md:overflow-y-auto scrollbar">
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
                />
              </div>
            </div>
          </div>
        </div>
        {task?.projectId === undefined ? (
          <div className="flex items-center justify-end px-4 md:px-6 py-3 shrink-0">
            <TaskFooter
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
              isSandboxActive={isSandboxActive}
              isSandboxStarting={isSandboxStarting}
              isSandboxStopping={isSandboxStopping}
              isRetryingStartupCommands={isRetryingStartupCommands}
              canCreatePr={canCreatePr}
              isCreatingPr={isCreatingPr}
              onCreatePr={handleCreatePr}
              onStartSandbox={handleStartSandbox}
              onViewSandbox={handleToggleSandboxView}
              onStopSandbox={handleStopSandbox}
              onRunStartupCommands={handleRetryStartupCommands}
              onStartExecution={handleStartExecution}
              onResolveConfirm={() => setShowResolveConfirm(true)}
              onRequestChanges={() => {
                setRequestingChanges(true);
                if (executionError) setExecutionError(null);
                setActiveTab("comments");
              }}
            />
          </div>
        ) : null}
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
    </>
  );
}
