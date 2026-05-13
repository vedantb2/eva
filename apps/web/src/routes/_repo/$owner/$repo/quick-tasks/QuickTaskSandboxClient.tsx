"use client";

import { Button, Spinner } from "@conductor/ui";
import {
  IconArrowLeft,
  IconChevronRight,
  IconLoader2,
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
    <PageWrapper
      title={
        <div className="flex min-w-0 flex-1 items-center gap-1.5 text-base sm:text-lg md:text-xl">
          <button
            onClick={() => navigate({ to: `${basePath}/quick-tasks` })}
            className="text-muted-foreground hover:text-foreground transition-colors font-semibold whitespace-nowrap flex-shrink-0"
          >
            Quick Tasks
          </button>
          <IconChevronRight
            size={14}
            className="text-muted-foreground/50 flex-shrink-0"
          />
          <span className="min-w-0 flex-1 truncate font-semibold">
            {task?.taskNumber ? `#${task.taskNumber}` : ""}
            {task?.title ? ` ${task.title}` : ""}
          </span>
        </div>
      }
      fillHeight
      childPadding={false}
      headerRight={
        <>
          {isSandboxStarting && !isSandboxActive ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <IconLoader2 size={16} className="animate-spin" />
              <span className="hidden sm:inline">Starting sandbox...</span>
            </div>
          ) : null}
          {isSandboxStopping ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <IconLoader2 size={16} className="animate-spin" />
              <span className="hidden sm:inline">Stopping sandbox...</span>
            </div>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleSandboxView}
            className="gap-1.5 rounded-full"
          >
            <IconArrowLeft size={16} />
            <span className="hidden sm:inline">Back to Details</span>
          </Button>
        </>
      }
    >
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
    </PageWrapper>
  );
}
