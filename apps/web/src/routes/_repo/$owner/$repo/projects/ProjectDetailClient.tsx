import { useRef, useState, useCallback } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
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
  Spinner,
} from "@conductor/ui";
import { useRepo } from "@/lib/contexts/RepoContext";
import type { Id } from "@conductor/backend";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { ProjectTabs } from "@/lib/components/projects/ProjectTabs";
import { ProjectActiveLayout } from "@/lib/components/projects/ProjectActiveLayout";
import { ProjectMetadataBar } from "@/lib/components/projects/ProjectMetadataBar";

import {
  IconGitPullRequest,
  IconHammer,
  IconPlayerStop,
  IconPlayerPlay,
  IconTerminal2,
  IconLoader2,
  IconChevronRight,
  IconChevronDown,
  IconCalendarClock,
  IconBrandVercel,
  IconArrowLeft,
} from "@tabler/icons-react";
import dayjs from "@conductor/shared/dates";
import { useNavigate } from "@tanstack/react-router";
import { ScheduleBuildPopover } from "@/lib/components/projects/ScheduleBuildPopover";
import { StopConfirmDialog } from "@/lib/components/tasks/_components/StopConfirmDialog";
import { StreamingActivityDisplay } from "@/lib/components/StreamingActivityDisplay";
import { ProjectSandboxPanel } from "./_components/ProjectSandboxPanel";
import { Route } from "./$projectId";

export function ProjectDetailClient() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();
  const { basePath, repo } = useRepo();
  const typedProjectId = projectId as Id<"projects">;
  const [isBuildModalOpen, setIsBuildModalOpen] = useState(false);
  const [isStartingBuild, setIsStartingBuild] = useState(false);
  const [isStoppingBuild, setIsStoppingBuild] = useState(false);
  const [showStopBuildConfirm, setShowStopBuildConfirm] = useState(false);
  const startBuild = useMutation(api.buildWorkflow.startBuild);
  const cancelBuild = useMutation(api.buildWorkflow.cancelBuild);
  const startProjectSandboxMutation = useMutation(
    api.projects.startProjectSandbox,
  );
  const stopProjectSandboxMutation = useMutation(
    api.projects.stopProjectSandbox,
  );

  const [showSandbox, setShowSandbox] = useState(false);
  const [isSandboxStartingLocal, setIsSandboxStartingLocal] = useState(false);
  const [isSandboxStoppingLocal, setIsSandboxStoppingLocal] = useState(false);

  const project = useQuery(api.projects.get, { id: typedProjectId });
  const streaming = useQuery(api.streaming.get, { entityId: projectId });
  const latestDeployment = useQuery(
    api.agentRuns.getLatestDeploymentByProject,
    { projectId: typedProjectId },
  );
  const currentUserId = useQuery(api.auth.me);
  const isOwner = project ? currentUserId === project.userId : false;

  const isSandboxActive = project?.reviewProjectSandboxStatus === "active";
  const isSandboxStartingFromStatus =
    project?.reviewProjectSandboxStatus === "starting";
  const isSandboxStoppingFromStatus =
    project?.reviewProjectSandboxStatus === "stopping";
  const isSandboxStarting =
    isSandboxStartingLocal || isSandboxStartingFromStatus;
  const isSandboxStopping =
    isSandboxStoppingLocal || isSandboxStoppingFromStatus;

  const sandboxStartupStreaming = useQuery(
    api.streaming.get,
    isSandboxStartingFromStatus
      ? { entityId: `project-sandbox-startup-${typedProjectId}` }
      : "skip",
  );

  const canStartSandbox =
    project?.phase === "active" || project?.phase === "completed";

  const handleStartSandbox = useCallback(async () => {
    setIsSandboxStartingLocal(true);
    try {
      await startProjectSandboxMutation({ projectId: typedProjectId });
      setShowSandbox(true);
    } catch (err) {
      console.error("Failed to start sandbox:", err);
    } finally {
      setIsSandboxStartingLocal(false);
    }
  }, [startProjectSandboxMutation, typedProjectId]);

  const handleStopSandbox = useCallback(async () => {
    setIsSandboxStoppingLocal(true);
    try {
      await stopProjectSandboxMutation({ projectId: typedProjectId });
      setShowSandbox(false);
    } catch (err) {
      console.error("Failed to stop sandbox:", err);
    } finally {
      setIsSandboxStoppingLocal(false);
    }
  }, [stopProjectSandboxMutation, typedProjectId]);

  const handleToggleSandboxView = useCallback(() => {
    setShowSandbox((prev) => !prev);
  }, []);

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

  if (showSandbox && (isSandboxActive || isSandboxStarting)) {
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
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleSandboxView}
              className="gap-1.5"
            >
              <IconArrowLeft size={16} />
              Back
            </Button>
            {isSandboxStarting && !isSandboxActive ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <IconLoader2 size={16} className="animate-spin" />
                Starting sandbox...
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
                Stop Sandbox
              </Button>
            ) : null}
          </div>
        }
      >
        <div className="flex-1 min-h-0">
          {isSandboxActive && project.sandboxId ? (
            <ProjectSandboxPanel
              projectId={typedProjectId}
              sandboxId={project.sandboxId}
              isActive={isSandboxActive}
              repoId={project.repoId}
              devPort={project.devPort}
              devCommand={project.devCommand}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="w-full max-w-md px-4">
                <StreamingActivityDisplay
                  activity={sandboxStartupStreaming?.currentActivity}
                  thinkingLabel="Starting sandbox..."
                />
              </div>
            </div>
          )}
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
          <div className="flex items-center gap-1.5 sm:gap-2">
            {canStartSandbox ? (
              isSandboxActive || isSandboxStarting ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleSandboxView}
                    className="gap-1.5"
                  >
                    {isSandboxStarting && !isSandboxActive ? (
                      <IconLoader2 size={14} className="animate-spin" />
                    ) : (
                      <IconTerminal2 size={14} />
                    )}
                    <span className="hidden sm:inline">View Sandbox</span>
                  </Button>
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
                      <span className="hidden sm:inline">Stop</span>
                    </Button>
                  ) : null}
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStartSandbox}
                  className="gap-1.5"
                >
                  <IconPlayerPlay size={14} />
                  <span className="hidden sm:inline">Start Sandbox</span>
                </Button>
              )
            ) : null}
            {latestDeployment?.deploymentStatus === "deployed" &&
              latestDeployment.deploymentUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  asChild
                >
                  <a
                    href={latestDeployment.deploymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <IconBrandVercel size={16} />
                    <span className="hidden sm:inline">View Preview</span>
                  </a>
                </Button>
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
