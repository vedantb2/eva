import { useRef, useState, useEffect } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useAction, useMutation } from "convex/react";
import { useNavigate } from "@tanstack/react-router";
import { api } from "@eva/backend";
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
} from "@eva/ui";
import { useRepo } from "@/lib/contexts/RepoContext";
import { entityPathSegment } from "@/lib/numId";
import type { Id } from "@eva/backend";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { EntityNotFound } from "@/lib/components/EntityNotFound";
import { ProjectTabs } from "@/lib/components/projects/ProjectTabs";
import { ProjectActiveLayout } from "@/lib/components/projects/ProjectActiveLayout";
import { ProjectMetadataBar } from "@/lib/components/projects/ProjectMetadataBar";
import { ProjectSandboxPanel } from "@/lib/components/projects/ProjectSandboxPanel";
import { ProjectSandboxChatPanel } from "@/lib/components/projects/ProjectSandboxChatPanel";
import { useProjectSandbox } from "@/lib/components/projects/useProjectSandbox";
import { ResizablePanelLayout } from "@/lib/components/ResizablePanelLayout";
import { ProjectContextUsage } from "@/lib/components/context-usage";
import { CopyLinkMenuItem } from "@/lib/components/CopyLinkButton";
import { MarqueeOnHover } from "@/lib/components/ui/MarqueeOnHover";

import {
  IconGitPullRequest,
  IconHammer,
  IconPlayerStop,
  IconTerminal2,
  IconLoader2,
  IconChevronRight,
  IconChevronDown,
  IconCalendarClock,
  IconBrandVercel,
  IconDots,
  IconRefresh,
  IconFileText,
  IconMessage,
  IconServerBolt,
} from "@tabler/icons-react";
import dayjs from "@eva/shared/dates";
import { ScheduleBuildPopover } from "@/lib/components/projects/ScheduleBuildPopover";
import { StopConfirmDialog } from "@/lib/components/tasks/_components/StopConfirmDialog";
import { ResolveConfirmDialog } from "@/lib/components/tasks/_components/ResolveConfirmDialog";
import { StartupCommandsConfirmDialog } from "@/lib/components/tasks/_components/StartupCommandsConfirmDialog";
import type { TaskRouteSandboxTab } from "@/lib/search-params";
import type { TaskDetailTab } from "@/lib/components/tasks/_components/task-detail-constants";
import type { EntityResolveStatus } from "@/lib/components/EntityNumIdGate";
import { parseSpec } from "@/lib/utils/parseSpec";
import { ProjectChatMessageList } from "@/lib/components/projects/ProjectChatMessageList";
import { projectProjectInterview } from "@/lib/components/projects/projectChatMessage.utils";
import { toInternalRepoHref } from "@/lib/utils/repoUrl";

export function ProjectDetailClient({
  projectId,
  projectNumId,
  surface,
  sandboxTab,
  selectedTaskId,
  selectedTaskStatus,
  detailTab,
}: {
  projectId: Id<"projects">;
  projectNumId?: number;
  surface: "main" | "sandbox";
  sandboxTab?: TaskRouteSandboxTab;
  selectedTaskId?: Id<"agentTasks">;
  /** Resolve status of selectedTaskId's numId; undefined when no task is selected. */
  selectedTaskStatus?: EntityResolveStatus;
  detailTab?: TaskDetailTab;
}) {
  const navigate = useNavigate();
  const { basePath, repo } = useRepo();
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

  const project = useQuery(api.projects.get, { id: projectId });
  const streaming = useQuery(api.streaming.get, { entityId: projectId });
  const latestDeployment = useQuery(
    api.agentRuns.getLatestDeploymentByProject,
    { projectId: projectId },
  );

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
    handleRunBackgroundCommands,
    isRunningBackgroundCommands,
  } = useProjectSandbox(
    projectId,
    project?.phase,
    project?.sandboxId,
    project?.reviewProjectSandboxStatus,
  );

  const prewarmChatDaemon = useMutation(
    api.projectChatWorkflow.prewarmChatDaemon,
  );
  useEffect(() => {
    if (!isSandboxActive || !projectSandboxId) return;
    void prewarmChatDaemon({ projectId });
  }, [projectId, isSandboxActive, projectSandboxId, prewarmChatDaemon]);

  const isSandboxSurface = surface === "sandbox";

  const projectPathSegment = entityPathSegment({ numId: projectNumId });

  const toggleProjectSandboxView = () => {
    if (!projectPathSegment) return;
    if (isSandboxSurface) {
      navigate({
        to: toInternalRepoHref(`${basePath}/projects/${projectPathSegment}`),
      });
      return;
    }
    navigate({
      to: toInternalRepoHref(
        `${basePath}/projects/${projectPathSegment}/sandbox/preview`,
      ),
    });
  };

  // Chat file chips → Files tab + `?file=` (same pattern as sessions).
  const openFile = (path: string) => {
    if (!projectPathSegment) return;
    void navigate({
      to: toInternalRepoHref(
        `${basePath}/projects/${projectPathSegment}/sandbox/files`,
      ),
      search: (prev) => ({ ...prev, file: path }),
    });
  };

  // Auto-switch to Browser + expand sandbox panel on lock transition only
  // (undefined → set). Mirrors SessionDetailClient's pattern. Don't fight the
  // user if they switch away mid-lock.
  const prevAgentBrowsingAt = useRef<number | undefined>(undefined);
  const [expandRightSignal, setExpandRightSignal] = useState(0);
  const agentBrowsingAt =
    project === null || project === undefined
      ? undefined
      : project.agentBrowsingAt;
  useEffect(() => {
    const prev = prevAgentBrowsingAt.current;
    prevAgentBrowsingAt.current = agentBrowsingAt;
    if (agentBrowsingAt === undefined || prev !== undefined) return;
    if (!projectPathSegment) return;
    void navigate({
      to: toInternalRepoHref(
        `${basePath}/projects/${projectPathSegment}/sandbox/browser`,
      ),
      search: true,
    });
    setExpandRightSignal((n) => n + 1);
    // Full deps are safe: the ref guard above makes re-runs no-ops, and a
    // disable comment here makes React Compiler skip the whole file.
  }, [agentBrowsingAt, basePath, navigate, projectPathSegment]);

  const handleStopBuild = async () => {
    if (!project) return;
    setIsStoppingBuild(true);
    try {
      await cancelBuild({ projectId: projectId });
    } catch (err) {
      console.error("Failed to stop build:", err);
    }
    setIsStoppingBuild(false);
  };

  const handleCreatePr = async () => {
    setPrError(null);
    setIsCreatingPr(true);
    try {
      await createProjectPrAction({ projectId: projectId });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create PR";
      setPrError(message);
    }
    setIsCreatingPr(false);
  };

  const handleResolveConflicts = async () => {
    setPrError(null);
    setIsResolvingConflicts(true);
    try {
      await resolveProjectConflicts({ projectId: projectId });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to resolve conflicts";
      setPrError(message);
    }
    setIsResolvingConflicts(false);
  };

  if (project === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (project === null) {
    return (
      <EntityNotFound entityLabel="project" backTo={`${basePath}/projects`} />
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
  const showRunBackgroundCommands = isSandboxActive;
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
  const hasSandboxCommandItems =
    showRetryStartupCommands || showRunBackgroundCommands;
  const hasPrLinkItems =
    canCreatePr || Boolean(project.prUrl) || hasDeployedPreview;

  const tab = sandboxTab ?? "preview";
  // Always mount the sandbox panel when the project can have one so tabs
  // stay reachable while stopped — same as sessions. Panes self-gate.
  const projectSandboxPanel =
    canStartSandbox ||
    projectSandboxId ||
    isSandboxActive ||
    isSandboxStarting ||
    isSandboxStopping ? (
      <ProjectSandboxPanel
        projectId={projectId}
        projectNumId={projectNumId}
        sandboxId={projectSandboxId}
        isActive={isSandboxActive}
        repoId={repo._id}
        prUrl={project.prUrl}
        devPort={project.devPort}
        devCommand={project.devCommand}
        terminalPanes={project.terminalPanes}
        sandboxTab={tab}
        onStartSandbox={
          canStartSandbox && !isSandboxStopping ? handleStartSandbox : undefined
        }
        isSandboxStarting={isSandboxStarting}
      />
    ) : (
      <div className="flex h-full items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <IconTerminal2 size={32} className="text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Sandbox is not available for this project yet
          </p>
        </div>
      </div>
    );

  const projectSandboxContent = (
    <ResizablePanelLayout
      storageKey="project-sandbox-panel"
      leftDefaultSize="40%"
      leftMinWidthPx={350}
      rightMinWidthPx={300}
      defaultRightCollapsed={false}
      expandRightSignal={expandRightSignal}
      leftPanel={({ rightPanelCollapsed, onToggleRightPanel }) => (
        <ProjectSandboxChatPanel
          projectId={projectId}
          isSandboxActive={isSandboxActive}
          onOpenFile={openFile}
          sandboxCollapsed={rightPanelCollapsed}
          onToggleSandbox={onToggleRightPanel}
        />
      )}
      rightPanel={projectSandboxPanel}
    />
  );

  return (
    <PageWrapper
      title={
        <div className="flex items-center gap-1.5 text-base sm:text-lg md:text-xl">
          <Button
            variant="ghost"
            onClick={() =>
              navigate({ to: toInternalRepoHref(`${basePath}/projects`) })
            }
            className="h-auto rounded-control p-0 text-muted-foreground hover:bg-transparent hover:text-foreground font-semibold"
          >
            Projects
          </Button>
          <IconChevronRight
            size={14}
            className="text-muted-foreground/50 flex-shrink-0"
          />
          <MarqueeOnHover className="min-w-0 font-semibold">
            {project.title}
          </MarqueeOnHover>
        </div>
      }
      fillHeight
      childPadding={false}
      headerRight={
        !isDraftOrFinalized ? (
          <div className="flex flex-col items-end gap-1">
            {prError && <p className="text-xs text-destructive">{prError}</p>}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <ProjectContextUsage repoId={repo._id} projectId={projectId} />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon-sm" aria-label="More">
                    <IconDots size={16} />
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
                  {showResolveConflicts && hasSandboxCommandItems ? (
                    <DropdownMenuSeparator />
                  ) : null}
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
                  {showRunBackgroundCommands && (
                    <DropdownMenuItem
                      onClick={handleRunBackgroundCommands}
                      disabled={isRunningBackgroundCommands}
                    >
                      {isRunningBackgroundCommands ? (
                        <IconLoader2 size={14} className="animate-spin" />
                      ) : (
                        <IconServerBolt size={14} />
                      )}
                      Run Background Commands
                    </DropdownMenuItem>
                  )}
                  {(showResolveConflicts || hasSandboxCommandItems) &&
                  hasPrLinkItems ? (
                    <DropdownMenuSeparator />
                  ) : null}
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
                  {project.prUrl ? (
                    <DropdownMenuItem asChild>
                      <a
                        href={project.prUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <IconGitPullRequest size={14} />
                        View PR
                      </a>
                    </DropdownMenuItem>
                  ) : null}
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
                      {(showResolveConflicts ||
                        hasSandboxCommandItems ||
                        hasPrLinkItems) && <DropdownMenuSeparator />}
                      <DropdownMenuItem onClick={() => setShowPlanModal(true)}>
                        <IconFileText size={14} />
                        View Plan
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowChatModal(true)}>
                        <IconMessage size={14} />
                        View Interview History
                      </DropdownMenuItem>
                    </>
                  )}
                  {(showResolveConflicts ||
                    hasSandboxCommandItems ||
                    hasPrLinkItems ||
                    hasPlanContext) && <DropdownMenuSeparator />}
                  <CopyLinkMenuItem />
                </DropdownMenuContent>
              </DropdownMenu>
              {isSandboxActive && !isSandboxStopping ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleStopSandbox}
                  disabled={isSandboxStopping}
                >
                  <IconPlayerStop size={16} />
                  <span className="hidden sm:inline">Stop Sandbox</span>
                </Button>
              ) : null}
              {canStartSandbox ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={toggleProjectSandboxView}
                  disabled={isSandboxStopping}
                  className={
                    isSandboxSurface || isSandboxActive
                      ? "border-success/35 bg-success/10 text-success hover:border-success/50 hover:bg-success/15 hover:text-success"
                      : undefined
                  }
                >
                  {(isSandboxStarting && !isSandboxActive) ||
                  isSandboxStopping ? (
                    <IconLoader2 size={16} className="animate-spin" />
                  ) : (
                    <IconTerminal2 size={16} />
                  )}
                  {isSandboxActive && !isSandboxSurface && (
                    <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  )}
                  <span className="hidden sm:inline">
                    {isSandboxStopping
                      ? "Stopping..."
                      : isSandboxStarting && !isSandboxActive
                        ? "Starting..."
                        : isSandboxSurface
                          ? "Back to Tasks"
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
                  projectId={projectId}
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
      {/* Status/metadata bar is detail-only — sandbox stays flush like sessions. */}
      {isSandboxSurface ? null : <ProjectMetadataBar projectId={projectId} />}
      <div className="flex min-h-0 flex-1 flex-col">
        {isSandboxSurface ? (
          <div className="min-h-0 flex-1 overflow-hidden">
            {projectSandboxContent}
          </div>
        ) : isDraftOrFinalized ? (
          <ProjectTabs
            projectId={projectId}
            projectPhase={project.phase}
            activeWorkflowId={project.activeWorkflowId}
            generatedSpec={project.generatedSpec}
            conversationHistory={project.conversationHistory}
            streamingActivity={streaming?.currentActivity}
            sandboxStartupActivity={sandboxStartupActivity}
            basePath={basePath}
            repoId={repo._id}
          />
        ) : (
          <ProjectActiveLayout
            projectId={projectId}
            project={project}
            basePath={basePath}
            selectedTaskId={selectedTaskId}
            selectedTaskStatus={selectedTaskStatus}
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
                    projectId: projectId,
                  });
                  setIsBuildModalOpen(false);
                } catch (error) {
                  setIsStartingBuild(false);
                  throw error;
                }
                setIsStartingBuild(false);
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
                      className="flex items-start gap-2 p-2 bg-muted rounded-control"
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
              <ProjectChatMessageList
                projection={projectProjectInterview(
                  project.conversationHistory,
                )}
              />
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
    <div className="group/split flex items-center transition-[transform,background-color] duration-200 active:scale-[0.96]">
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
