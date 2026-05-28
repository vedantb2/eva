import { useCallback, useRef, useState } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useAction, useMutation } from "convex/react";
import { api } from "@conductor/backend";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DialogBody,
  Spinner,
} from "@conductor/ui";
import { useRepo } from "@/lib/contexts/RepoContext";
import type { Id } from "@conductor/backend";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { ProjectTabs } from "@/lib/components/projects/ProjectTabs";
import { ProjectActiveLayout } from "@/lib/components/projects/ProjectActiveLayout";
import { ProjectMetadataBar } from "@/lib/components/projects/ProjectMetadataBar";
import { ProjectSandboxPanel } from "@/lib/components/projects/ProjectSandboxPanel";
import { ProjectSandboxChatPanel } from "@/lib/components/projects/ProjectSandboxChatPanel";
import { useProjectSandbox } from "@/lib/components/projects/useProjectSandbox";
import { StreamingActivityDisplay } from "@/lib/components/StreamingActivityDisplay";
import { ResizablePanelLayout } from "@/lib/components/ResizablePanelLayout";
import { ProjectContextUsage } from "@/lib/components/context-usage";

import {
  IconGitPullRequest,
  IconHammer,
  IconPlayerStop,
  IconPlayerPlay,
  IconTerminal2,
  IconArrowLeft,
  IconLoader2,
  IconChevronRight,
  IconChevronDown,
  IconCalendarClock,
  IconBrandVercel,
  IconDots,
  IconRefresh,
  IconFileText,
  IconMessage,
} from "@tabler/icons-react";
import dayjs from "@conductor/shared/dates";
import { useNavigate } from "@tanstack/react-router";
import { ScheduleBuildPopover } from "@/lib/components/projects/ScheduleBuildPopover";
import { StopConfirmDialog } from "@/lib/components/tasks/_components/StopConfirmDialog";
import { ResolveConfirmDialog } from "@/lib/components/tasks/_components/ResolveConfirmDialog";
import { StartupCommandsConfirmDialog } from "@/lib/components/tasks/_components/StartupCommandsConfirmDialog";
import type { TaskRouteSandboxTab } from "@/lib/search-params";
import type { TaskDetailTab } from "@/lib/components/tasks/_components/task-detail-constants";
import { parseSpec } from "@/lib/utils/parseSpec";
import type { ConversationMessage } from "@/lib/components/projects/ProjectChatTab";
import { ProjectChatMessageList } from "@/lib/components/projects/ProjectChatMessageList";

export function ProjectDetailClient({
  projectId,
  surface,
  sandboxTab,
  selectedTaskId,
  detailTab,
}: {
  projectId: string;
  surface: "main" | "sandbox";
  sandboxTab?: TaskRouteSandboxTab;
  selectedTaskId?: string;
  detailTab?: TaskDetailTab;
}) {
  const navigate = useNavigate();
  const { basePath, repo } = useRepo();
  const typedProjectId = projectId as Id<"projects">;
  const [isBuildModalOpen, setIsBuildModalOpen] = useState(false);
  const [isStartingBuild, setIsStartingBuild] = useState(false);
  const [isStoppingBuild, setIsStoppingBuild] = useState(false);
  const [showStopBuildConfirm, setShowStopBuildConfirm] = useState(false);
  const [showResolveConfirm, setShowResolveConfirm] = useState(false);
  const [showStartupCommandsConfirm, setShowStartupCommandsConfirm] =
    useState(false);
  const [isCreatingPr, setIsCreatingPr] = useState(false);
  const [isResolvingConflicts, setIsResolvingConflicts] = useState(false);
  const [prError, setPrError] = useState<string | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const startBuild = useMutation(api.buildWorkflow.startBuild);
  const cancelBuild = useMutation(api.buildWorkflow.cancelBuild);
  const resolveProjectConflicts = useMutation(
    api.projects.resolveProjectConflicts,
  );
  const createProjectPrAction = useAction(
    api.taskWorkflowActions.createProjectPr,
  );

  const project = useQuery(api.projects.get, { id: typedProjectId });
  const streaming = useQuery(api.streaming.get, { entityId: projectId });
  const latestDeployment = useQuery(
    api.agentRuns.getLatestDeploymentByProject,
    { projectId: typedProjectId },
  );
  const currentUserId = useQuery(api.auth.me);
  const isOwner = project ? currentUserId === project.userId : false;

  const {
    canStartSandbox,
    isSandboxActive,
    isSandboxStarting,
    isSandboxStopping,
    sandboxStartupActivity,
    sandboxId: projectSandboxId,
    handleStartSandbox,
    handleStopSandbox,
    handleRetryStartupCommands,
    isRetryingStartupCommands,
  } = useProjectSandbox(
    typedProjectId,
    project?.phase,
    project?.sandboxId,
    project?.reviewProjectSandboxStatus,
  );

  const openProjectSandboxView = () => {
    navigate({ to: `${basePath}/projects/${projectId}/sandbox/preview` });
  };

  const exitProjectSandboxView = () => {
    navigate({ to: `${basePath}/projects/${projectId}` });
  };

  const handleStopBuild = async () => {
    if (!project) return;
    setIsStoppingBuild(true);
    try {
      await cancelBuild({ projectId: typedProjectId });
    } catch (err) {
      console.error("Failed to stop build:", err);
    } finally {
      setIsStoppingBuild(false);
    }
  };

  const handleCreatePr = useCallback(async () => {
    setPrError(null);
    setIsCreatingPr(true);
    try {
      await createProjectPrAction({ projectId: typedProjectId });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create PR";
      setPrError(message);
    } finally {
      setIsCreatingPr(false);
    }
  }, [createProjectPrAction, typedProjectId]);

  const handleResolveConflicts = useCallback(async () => {
    setPrError(null);
    setIsResolvingConflicts(true);
    try {
      await resolveProjectConflicts({ projectId: typedProjectId });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to resolve conflicts";
      setPrError(message);
    } finally {
      setIsResolvingConflicts(false);
    }
  }, [resolveProjectConflicts, typedProjectId]);

  if (project === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (project === null) {
    return (
      <PageWrapper>
        <div className="py-12 text-center">
          <p className="text-muted-foreground">Project not found</p>
        </div>
      </PageWrapper>
    );
  }

  const isDraftOrFinalized =
    project.phase === "draft" || project.phase === "finalized";

  const hasDeployedPreview =
    latestDeployment?.deploymentStatus === "deployed" &&
    Boolean(latestDeployment.deploymentUrl);
  const canCreatePr =
    !project.prUrl &&
    !project.activeBuildWorkflowId &&
    (project.phase === "business_review" || project.phase === "in_progress");
  const showRetryStartupCommands =
    canStartSandbox && !isSandboxStarting && !isSandboxStopping;
  const showResolveConflicts =
    Boolean(project.prUrl) &&
    !project.activeBuildWorkflowId &&
    (project.phase === "business_review" || project.phase === "code_review");
  const parsedSpec = (() => {
    if (!project.generatedSpec) return null;
    try {
      return parseSpec(project.generatedSpec);
    } catch {
      return null;
    }
  })();
  const hasPlanContext = Boolean(parsedSpec);
  const showMoreMenu =
    canCreatePr ||
    hasDeployedPreview ||
    showRetryStartupCommands ||
    showResolveConflicts ||
    hasPlanContext;

  if (surface === "sandbox") {
    const tab = sandboxTab ?? "preview";
    const isSandboxInactive =
      !isSandboxActive && !isSandboxStarting && !isSandboxStopping;
    const sandboxPanel =
      isSandboxActive && projectSandboxId ? (
        <ProjectSandboxPanel
          projectId={typedProjectId}
          sandboxId={projectSandboxId}
          isActive={isSandboxActive}
          repoId={repo._id}
          devPort={project.devPort}
          devCommand={project.devCommand}
          terminalPanes={project.terminalPanes}
          sandboxTab={tab}
        />
      ) : isSandboxInactive && canStartSandbox ? (
        <div className="flex items-center justify-center h-full p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <IconTerminal2 size={32} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Sandbox is not running
            </p>
            <Button onClick={handleStartSandbox}>
              <IconPlayerPlay size={16} />
              Start Sandbox
            </Button>
          </div>
        </div>
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
      );
    return (
      <PageWrapper
        title={
          <div className="flex items-center gap-1.5 text-base sm:text-lg md:text-xl">
            <button
              onClick={() => navigate({ to: `${basePath}/projects` })}
              className="text-muted-foreground hover:text-foreground transition-colors font-semibold"
            >
              Projects
            </button>
            <IconChevronRight
              size={14}
              className="text-muted-foreground/50 flex-shrink-0"
            />
            <span className="truncate font-semibold">{project.title}</span>
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
            {isSandboxActive && !isSandboxStopping ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleStopSandbox}
                disabled={isSandboxStopping}
                className="rounded-full"
              >
                <IconPlayerStop size={16} />
                <span className="hidden sm:inline">Stop Sandbox</span>
              </Button>
            ) : null}
            <Button
              variant="outline"
              size="sm"
              onClick={exitProjectSandboxView}
              className="gap-1.5 rounded-full"
            >
              <IconArrowLeft size={16} />
              <span className="hidden sm:inline">Back to Tasks</span>
            </Button>
          </>
        }
      >
        <ResizablePanelLayout
          storageKey="project-sandbox-collapsed"
          leftDefaultSize="30%"
          leftMinWidthPx={350}
          rightMinWidthPx={300}
          defaultRightCollapsed={false}
          leftPanel={() => (
            <ProjectSandboxChatPanel
              projectId={typedProjectId}
              isSandboxActive={isSandboxActive}
            />
          )}
          rightPanel={sandboxPanel}
        />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title={
        <div className="flex items-center gap-1.5 text-base sm:text-lg md:text-xl">
          <button
            onClick={() => navigate({ to: `${basePath}/projects` })}
            className="text-muted-foreground hover:text-foreground transition-colors font-semibold"
          >
            Projects
          </button>
          <IconChevronRight
            size={14}
            className="text-muted-foreground/50 flex-shrink-0"
          />
          <span className="truncate font-semibold">{project.title}</span>
        </div>
      }
      fillHeight
      childPadding={false}
      headerRight={
        !isDraftOrFinalized ? (
          <div className="flex flex-col items-end gap-1">
            {prError && <p className="text-xs text-destructive">{prError}</p>}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <ProjectContextUsage
                repoId={repo._id}
                projectId={typedProjectId}
              />
              {showMoreMenu && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                    >
                      <IconDots size={16} />
                      <span className="hidden sm:inline">More</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {showResolveConflicts && (
                      <DropdownMenuItem
                        onClick={() => setShowResolveConfirm(true)}
                        disabled={isResolvingConflicts}
                      >
                        {isResolvingConflicts ? (
                          <IconLoader2 size={14} className="animate-spin" />
                        ) : (
                          <IconHammer size={14} />
                        )}
                        Resolve Conflicts
                      </DropdownMenuItem>
                    )}
                    {showRetryStartupCommands && (
                      <DropdownMenuItem
                        onClick={() => setShowStartupCommandsConfirm(true)}
                        disabled={isRetryingStartupCommands}
                      >
                        {isRetryingStartupCommands ? (
                          <IconLoader2 size={14} className="animate-spin" />
                        ) : (
                          <IconRefresh size={14} />
                        )}
                        Run Startup Commands
                      </DropdownMenuItem>
                    )}
                    {canCreatePr && (
                      <DropdownMenuItem
                        onClick={handleCreatePr}
                        disabled={isCreatingPr}
                      >
                        {isCreatingPr ? (
                          <IconLoader2 size={14} className="animate-spin" />
                        ) : (
                          <IconGitPullRequest size={14} />
                        )}
                        Create PR
                      </DropdownMenuItem>
                    )}
                    {hasDeployedPreview && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <DropdownMenuItem disabled>
                              <IconBrandVercel size={14} />
                              View Preview
                            </DropdownMenuItem>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          Please start sandbox and view changes through the
                          preview tab there instead
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {hasPlanContext && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setShowPlanModal(true)}
                        >
                          <IconFileText size={14} />
                          View Plan
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setShowChatModal(true)}
                        >
                          <IconMessage size={14} />
                          View Interview History
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {project.prUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  asChild
                >
                  <a
                    href={project.prUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <IconGitPullRequest size={16} />
                    <span className="hidden sm:inline">View PR</span>
                  </a>
                </Button>
              )}
              {canStartSandbox ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openProjectSandboxView}
                  disabled={isSandboxStopping}
                  className={
                    isSandboxActive
                      ? "rounded-full border-emerald-500/35 bg-emerald-500/10 text-emerald-700 hover:border-emerald-500/50 hover:bg-emerald-500/15 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-400"
                      : "rounded-full"
                  }
                >
                  {(isSandboxStarting && !isSandboxActive) ||
                  isSandboxStopping ? (
                    <IconLoader2 size={16} className="animate-spin" />
                  ) : (
                    <IconTerminal2 size={16} />
                  )}
                  {isSandboxActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                  <span className="hidden sm:inline">
                    {isSandboxStopping
                      ? "Stopping..."
                      : isSandboxStarting && !isSandboxActive
                        ? "Starting..."
                        : isSandboxActive
                          ? "View Sandbox · Active"
                          : "View Sandbox"}
                  </span>
                </Button>
              ) : null}
              {project.activeBuildWorkflowId ? (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setShowStopBuildConfirm(true)}
                  disabled={isStoppingBuild}
                >
                  {isStoppingBuild ? (
                    <IconLoader2 size={16} className="animate-spin" />
                  ) : (
                    <IconPlayerStop size={16} />
                  )}
                  <span className="hidden sm:inline">Stop Build</span>
                </Button>
              ) : (
                <SplitBuildButton
                  projectId={typedProjectId}
                  scheduledBuildAt={project.scheduledBuildAt}
                  hasActiveBuild={!!project.activeBuildWorkflowId}
                  onBuild={() => setIsBuildModalOpen(true)}
                />
              )}
            </div>
          </div>
        ) : null
      }
    >
      <ProjectMetadataBar projectId={typedProjectId} />
      <div className="flex-1 flex flex-col min-h-0">
        {isDraftOrFinalized ? (
          <ProjectTabs
            projectId={typedProjectId}
            projectPhase={project.phase}
            activeWorkflowId={project.activeWorkflowId}
            rawInput={project.rawInput}
            generatedSpec={project.generatedSpec}
            conversationHistory={project.conversationHistory}
            streamingActivity={streaming?.currentActivity}
            sandboxStartupActivity={sandboxStartupActivity}
            basePath={basePath}
            repoId={repo._id}
          />
        ) : (
          <ProjectActiveLayout
            projectId={typedProjectId}
            project={project}
            basePath={basePath}
            selectedTaskId={selectedTaskId}
            detailTab={detailTab}
          />
        )}
      </div>

      <Dialog
        open={isBuildModalOpen}
        onOpenChange={(v) => {
          if (!v) setIsBuildModalOpen(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Build Project</DialogTitle>
          </DialogHeader>
          <div>
            <p className="text-muted-foreground">
              This will allow Eva to autonomously work through all tasks in
              sequence until the project is fully built.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Best suited for projects with well-defined requirements. If Eva
              makes an error on an earlier task, it may carry forward into
              subsequent tasks.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsBuildModalOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={isStartingBuild}
              onClick={async () => {
                setIsStartingBuild(true);
                try {
                  await startBuild({
                    projectId: typedProjectId,
                  });
                  setIsBuildModalOpen(false);
                } finally {
                  setIsStartingBuild(false);
                }
              }}
            >
              <IconHammer size={16} />
              {isStartingBuild ? "Starting..." : "Start cooking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <StopConfirmDialog
        open={showStopBuildConfirm}
        onOpenChange={setShowStopBuildConfirm}
        onConfirm={handleStopBuild}
        isStopping={isStoppingBuild}
      />

      <ResolveConfirmDialog
        open={showResolveConfirm}
        onOpenChange={setShowResolveConfirm}
        onConfirm={handleResolveConflicts}
        isStarting={isResolvingConflicts}
      />

      <StartupCommandsConfirmDialog
        open={showStartupCommandsConfirm}
        onOpenChange={setShowStartupCommandsConfirm}
        onConfirm={handleRetryStartupCommands}
        isStarting={isRetryingStartupCommands}
      />

      {parsedSpec && (
        <Dialog open={showPlanModal} onOpenChange={setShowPlanModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Plan</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">{parsedSpec.title}</h3>
                  <p className="text-muted-foreground">
                    {parsedSpec.description}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-medium">
                    Tasks ({parsedSpec.tasks.length})
                  </h4>
                  {parsedSpec.tasks.map((task, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 p-2 bg-muted rounded"
                    >
                      <span className="text-muted-foreground font-mono">
                        {i + 1}.
                      </span>
                      <span>{task.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </DialogBody>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={showChatModal} onOpenChange={setShowChatModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader className="pb-4">
            <DialogTitle>
              <div className="flex items-center gap-2">
                <IconMessage size={20} />
                Interview History
                <span className="text-sm font-normal text-muted-foreground">
                  ({project.conversationHistory.length} messages)
                </span>
              </div>
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="flex flex-col gap-3 py-2">
              <ProjectChatMessageList messages={project.conversationHistory} />
            </div>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}

const SPLIT_BUTTON_HALF =
  "hover:translate-y-0 active:scale-100 group-hover/split:bg-primary/92";

function SplitBuildButton({
  projectId,
  scheduledBuildAt,
  hasActiveBuild,
  onBuild,
}: {
  projectId: Id<"projects">;
  scheduledBuildAt: number | undefined;
  hasActiveBuild: boolean;
  onBuild: () => void;
}) {
  const chevronRef = useRef<HTMLButtonElement>(null);
  const isScheduled = scheduledBuildAt !== undefined;

  return (
    <div className="group/split flex items-center transition-[transform,background-color] duration-200 hover:-translate-y-[1px] active:scale-[0.96]">
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Button
              size="sm"
              onClick={
                isScheduled ? () => chevronRef.current?.click() : onBuild
              }
              className={`rounded-r-none ${SPLIT_BUTTON_HALF}`}
            >
              {isScheduled ? (
                <IconCalendarClock size={16} />
              ) : (
                <IconHammer size={16} />
              )}
              <span className="hidden sm:inline">
                {isScheduled
                  ? dayjs(scheduledBuildAt).format("MMM D, h:mm A")
                  : "Build Project"}
              </span>
            </Button>
          </div>
        </TooltipTrigger>
        {isScheduled ? (
          <TooltipContent>Click to change or remove schedule</TooltipContent>
        ) : null}
      </Tooltip>
      <ScheduleBuildPopover
        projectId={projectId}
        scheduledBuildAt={scheduledBuildAt}
        disabled={hasActiveBuild}
        trigger={
          <Button
            ref={chevronRef}
            size="sm"
            disabled={hasActiveBuild}
            className={`rounded-l-none border-l border-l-primary-foreground/20 px-2 ${SPLIT_BUTTON_HALF}`}
          >
            <IconChevronDown size={14} />
          </Button>
        }
      />
    </div>
  );
}
