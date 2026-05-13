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
  Spinner,
} from "@conductor/ui";
import { useRepo } from "@/lib/contexts/RepoContext";
import type { Id } from "@conductor/backend";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { ProjectTabs } from "@/lib/components/projects/ProjectTabs";
import { ProjectActiveLayout } from "@/lib/components/projects/ProjectActiveLayout";
import { ProjectMetadataBar } from "@/lib/components/projects/ProjectMetadataBar";
import { ProjectSandboxPanel } from "@/lib/components/projects/ProjectSandboxPanel";
import { useProjectSandbox } from "@/lib/components/projects/useProjectSandbox";
import { StreamingActivityDisplay } from "@/lib/components/StreamingActivityDisplay";

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
} from "@tabler/icons-react";
import dayjs from "@conductor/shared/dates";
import { useNavigate } from "@tanstack/react-router";
import { ScheduleBuildPopover } from "@/lib/components/projects/ScheduleBuildPopover";
import { StopConfirmDialog } from "@/lib/components/tasks/_components/StopConfirmDialog";
import { ResolveConfirmDialog } from "@/lib/components/tasks/_components/ResolveConfirmDialog";
import { StartupCommandsConfirmDialog } from "@/lib/components/tasks/_components/StartupCommandsConfirmDialog";
import type { TaskRouteSandboxTab } from "@/lib/search-params";

export function ProjectDetailClient({
  projectId,
  surface,
  sandboxTab,
  selectedTaskId,
}: {
  projectId: string;
  surface: "main" | "sandbox";
  sandboxTab?: TaskRouteSandboxTab;
  selectedTaskId?: string;
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

  const handleStartSandboxAndOpen = async () => {
    await handleStartSandbox();
    openProjectSandboxView();
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
    project.phase === "active";
  const showRetryStartupCommands =
    canStartSandbox && !isSandboxStarting && !isSandboxStopping;
  const showResolveConflicts =
    Boolean(project.prUrl) &&
    !project.activeBuildWorkflowId &&
    project.phase === "active";
  const showMoreMenu =
    canCreatePr ||
    hasDeployedPreview ||
    showRetryStartupCommands ||
    showResolveConflicts;

  if (surface === "sandbox") {
    const tab = sandboxTab ?? "preview";
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
      >
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={exitProjectSandboxView}
              className="gap-1.5"
            >
              <IconArrowLeft size={16} />
              Back to Tasks
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
            </div>
          </div>
          <div className="flex-1 min-h-0">
            {isSandboxActive && projectSandboxId ? (
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
                isSandboxActive || isSandboxStarting || isSandboxStopping ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={openProjectSandboxView}
                      disabled={isSandboxStopping}
                    >
                      {isSandboxStarting && !isSandboxActive ? (
                        <IconLoader2 size={16} className="animate-spin" />
                      ) : isSandboxStopping ? (
                        <IconLoader2 size={16} className="animate-spin" />
                      ) : (
                        <IconTerminal2 size={16} />
                      )}
                      <span className="hidden sm:inline">
                        {isSandboxStopping ? "Stopping..." : "View Sandbox"}
                      </span>
                    </Button>
                    {isSandboxActive && !isSandboxStopping ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="rounded-full"
                        onClick={handleStopSandbox}
                        disabled={isSandboxStopping}
                      >
                        <IconPlayerStop size={16} />
                        <span className="hidden sm:inline">Stop Sandbox</span>
                      </Button>
                    ) : null}
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={handleStartSandboxAndOpen}
                  >
                    <IconPlayerPlay size={16} />
                    <span className="hidden sm:inline">Start Sandbox</span>
                  </Button>
                )
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
            rawInput={project.rawInput}
            generatedSpec={project.generatedSpec}
            conversationHistory={project.conversationHistory}
            streamingActivity={streaming?.currentActivity}
            basePath={basePath}
            repoId={repo._id}
          />
        ) : (
          <ProjectActiveLayout
            projectId={typedProjectId}
            project={project}
            basePath={basePath}
            generatedSpec={project.generatedSpec}
            conversationHistory={project.conversationHistory}
            selectedTaskId={selectedTaskId}
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
