import { useState } from "react";
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
  IconLoader2,
  IconChevronRight,
  IconChevronDown,
  IconCalendarClock,
} from "@tabler/icons-react";
import dayjs from "@conductor/shared/dates";
import { useNavigate } from "@tanstack/react-router";
import { ScheduleBuildPopover } from "@/lib/components/projects/ScheduleBuildPopover";
import { StopConfirmDialog } from "@/lib/components/tasks/_components/StopConfirmDialog";
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

  const project = useQuery(api.projects.get, { id: typedProjectId });
  const streaming = useQuery(api.streaming.get, { entityId: projectId });
  const currentUserId = useQuery(api.auth.me);
  const isOwner = project ? currentUserId === project.userId : false;

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
                disabled={!isOwner || isStoppingBuild}
              >
                {isStoppingBuild ? (
                  <IconLoader2 size={16} className="animate-spin" />
                ) : (
                  <IconPlayerStop size={16} />
                )}
                <span className="hidden sm:inline">Stop Build</span>
              </Button>
            ) : (
              <div className="group/split flex items-center transition-transform duration-200 hover:-translate-y-[1px]">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button
                        size="sm"
                        onClick={
                          project.scheduledBuildAt
                            ? undefined
                            : () => setIsBuildModalOpen(true)
                        }
                        disabled={!isOwner}
                        className="rounded-r-none hover:translate-y-0 group-hover/split:bg-primary/92"
                      >
                        {project.scheduledBuildAt ? (
                          <IconCalendarClock size={16} />
                        ) : (
                          <IconHammer size={16} />
                        )}
                        <span className="hidden sm:inline">
                          {project.scheduledBuildAt
                            ? dayjs(project.scheduledBuildAt).format(
                                "MMM D, h:mm A",
                              )
                            : "Build Project"}
                        </span>
                      </Button>
                    </div>
                  </TooltipTrigger>
                  {!isOwner ? (
                    <TooltipContent>
                      Only the project owner can build
                    </TooltipContent>
                  ) : project.scheduledBuildAt ? (
                    <TooltipContent>
                      Scheduled — open dropdown to change or remove
                    </TooltipContent>
                  ) : null}
                </Tooltip>
                <ScheduleBuildPopover
                  projectId={typedProjectId}
                  scheduledBuildAt={project.scheduledBuildAt}
                  disabled={!isOwner || !!project.activeBuildWorkflowId}
                  trigger={
                    <Button
                      size="sm"
                      disabled={!isOwner || !!project.activeBuildWorkflowId}
                      className="rounded-l-none border-l border-l-primary-foreground/20 px-2 hover:translate-y-0 group-hover/split:bg-primary/92"
                    >
                      <IconChevronDown size={14} />
                    </Button>
                  }
                />
              </div>
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
