"use client";

import type { Id } from "@conductor/backend";
import { Badge, Tabs, TabsList, TabsTrigger, TabsContent } from "@conductor/ui";
import {
  IconTerminal2,
  IconPhoto,
  IconShieldCheck,
  IconMessagePlus,
  IconLoader2,
  IconClock,
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
import { SubtaskList } from "./SubtaskList";

interface TaskDetailInlineProps {
  onClose: () => void;
  taskId: Id<"agentTasks">;
}

export function TaskDetailInline({ taskId }: TaskDetailInlineProps) {
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
    subtasks,
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
  } = useTaskDetail(taskId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <IconLoader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        <div className="px-4 pt-4 pb-3 md:px-6 md:pt-5 md:pb-3 flex-shrink-0">
          <TaskHeader
            taskNumber={task?.taskNumber}
            title={task?.title}
            canEditTaskText={canEditTaskText}
            taskId={taskId}
          />
          {task?.scheduledAt ? (
            <div className="flex items-center gap-1.5 mt-2">
              <Badge
                variant="outline"
                className="gap-1 text-xs font-normal text-muted-foreground"
              >
                <IconClock size={11} />
                {status === "todo" ? "Scheduled for" : "Was scheduled for"}{" "}
                {dayjs(task.scheduledAt).format("DD/MM/YYYY HH:mm")}
              </Badge>
            </div>
          ) : null}
        </div>
        <div className="px-4 md:px-6 flex-1 min-h-0 overflow-y-auto scrollbar flex flex-col">
          <div className="flex-1 flex flex-col pb-4">
            <div className="flex flex-col md:grid md:grid-rows-1 md:grid-cols-[14fr_6fr] flex-1 min-h-0">
              <div className="space-y-4 min-h-0 min-w-0 md:pr-6">
                <TaskDescription
                  description={task?.description}
                  createdAt={task?.createdAt}
                  canEditTaskText={canEditTaskText}
                  taskId={taskId}
                  inline={true}
                />
                {subtasks && subtasks.length > 0 ? (
                  <div className="pt-4">
                    <SubtaskList taskId={taskId} readOnly={status !== "todo"} />
                  </div>
                ) : null}
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
                      streaming={streaming}
                      auditStreaming={auditStreaming}
                      activeRunElapsed={activeRunElapsed}
                      auditElapsed={auditElapsed}
                      fixElapsed={fixElapsed}
                      isOwner={isOwner}
                      isStopping={isStopping}
                      onStopConfirm={() => setShowStopConfirm(true)}
                    />
                  </TabsContent>
                  <TabsContent value="proof" className="mt-3 sm:mt-4">
                    {showProofSection ? (
                      <ProofSection proofs={proofs} status={status} />
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
              <div className="md:pl-6 md:border-l md:border-border/60 flex flex-col min-h-0 min-w-0 md:overflow-y-auto scrollbar">
                <div className="flex-1">
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
                  />
                </div>
                <div className="flex items-center justify-end pt-4 mt-auto pb-4 md:pb-0 border-t border-border/60 md:border-0">
                  <TaskFooter
                    taskId={taskId}
                    task={task}
                    status={status}
                    isOwner={isOwner}
                    isBlocked={isBlocked}
                    hasActiveRun={hasActiveRun}
                    latestPrUrl={latestPrUrl}
                    latestDeployment={latestDeployment}
                    executionError={executionError}
                    isStarting={isStarting}
                    onStartExecution={handleStartExecution}
                    onResolveConfirm={() => setShowResolveConfirm(true)}
                    onRequestChanges={() => {
                      setRequestingChanges(true);
                      if (executionError) setExecutionError(null);
                      setActiveTab("comments");
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
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
