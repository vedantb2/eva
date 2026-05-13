"use client";

import { Button, Spinner } from "@conductor/ui";
import {
  IconArrowLeft,
  IconLoader2,
  IconPlayerStop,
} from "@tabler/icons-react";
import type { Id } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { useNavigate } from "@tanstack/react-router";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { TaskSandboxPanel } from "@/lib/components/tasks/TaskSandboxPanel";
import { TaskSandboxChatPanel } from "@/lib/components/tasks/TaskSandboxChatPanel";
import { StreamingActivityDisplay } from "@/lib/components/StreamingActivityDisplay";
import { ResizablePanelLayout } from "@/lib/components/ResizablePanelLayout";
import { useTaskDetail } from "@/lib/components/tasks/useTaskDetail";
import type { TaskRouteSandboxTab } from "@/lib/search-params";

interface QuickTaskSandboxClientProps {
  taskId: string;
  sandboxTab: TaskRouteSandboxTab;
}

export function QuickTaskSandboxClient({
  taskId,
  sandboxTab,
}: QuickTaskSandboxClientProps) {
  const navigate = useNavigate();
  const { basePath, repo } = useRepo();
  const typedTaskId = taskId as Id<"agentTasks">;

  const routing = {
    mode: "quick-sandbox" as const,
    quick: {
      sandboxTab,
      onSandboxTabChange: (tab: TaskRouteSandboxTab) => {
        navigate({
          to: `${basePath}/quick-tasks/${typedTaskId}/sandbox/${tab}`,
        });
      },
      onExitSandboxView: () => {
        navigate({
          to: `${basePath}/quick-tasks/${typedTaskId}/activity`,
        });
      },
    },
  };

  const {
    isLoading,
    task,
    isSandboxActive,
    isSandboxStarting,
    isSandboxStopping,
    sandboxId,
    sandboxStartupActivity,
    handleToggleSandboxView,
    handleStopSandbox,
  } = useTaskDetail(typedTaskId, routing);

  if (isLoading) {
    return (
      <div className="flex h-full flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const sandboxRightPanel =
    isSandboxActive && sandboxId && task?.repoId ? (
      <TaskSandboxPanel
        taskId={typedTaskId}
        sandboxId={sandboxId}
        isActive={isSandboxActive}
        repoId={task.repoId}
        devPort={task.devPort}
        devCommand={task.devCommand}
        terminalPanes={task.terminalPanes}
        activeTab={sandboxTab}
        onTabChange={(tab) => {
          routing.quick.onSandboxTabChange(tab === "prd" ? "preview" : tab);
        }}
      />
    ) : (
      <div className="flex items-center justify-center h-full">
        <div className="w-full max-w-md px-4">
          <StreamingActivityDisplay
            activity={sandboxStartupActivity}
            thinkingLabel={
              isSandboxStopping ? "Stopping sandbox..." : "Starting sandbox..."
            }
          />
        </div>
      </div>
    );

  return (
    <PageWrapper title="Sandbox" fillHeight childPadding={false}>
      <div className="flex flex-col h-full overflow-hidden">
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
        <div className="flex-1 min-h-0">
          <ResizablePanelLayout
            storageKey="task-sandbox-collapsed"
            leftDefaultSize="30%"
            leftMinWidthPx={350}
            rightMinWidthPx={300}
            defaultRightCollapsed={false}
            leftPanel={() => (
              <TaskSandboxChatPanel
                taskId={typedTaskId}
                isSandboxActive={isSandboxActive}
              />
            )}
            rightPanel={sandboxRightPanel}
          />
        </div>
      </div>
    </PageWrapper>
  );
}
