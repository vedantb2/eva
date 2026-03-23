"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
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
} from "@tabler/icons-react";
import Link from "next/link";
import { ScheduleBuildPopover } from "@/lib/components/projects/ScheduleBuildPopover";
import { StopConfirmDialog } from "@/lib/components/tasks/_components/StopConfirmDialog";

interface ProjectDetailClientProps {
  projectId: string;
}

export function ProjectDetailClient({ projectId }: ProjectDetailClientProps) {
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
      title={project.title}
      showBack
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
                <Link
                  href={project.prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <IconGitPullRequest size={16} />
                  <span className="hidden sm:inline">View PR</span>
                </Link>
              </Button>
            )}
            <div className="hidden sm:block">
              <ScheduleBuildPopover
                projectId={typedProjectId}
                scheduledBuildAt={project.scheduledBuildAt}
                disabled={!isOwner || !!project.activeBuildWorkflowId}
              />
            </div>
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      size="sm"
                      onClick={() => setIsBuildModalOpen(true)}
                      disabled={!isOwner || !!project.scheduledBuildAt}
                    >
                      <IconHammer size={16} />
                      <span className="hidden sm:inline">Build Project</span>
                    </Button>
                  </div>
                </TooltipTrigger>
                {!isOwner ? (
                  <TooltipContent>
                    Only the project owner can build
                  </TooltipContent>
                ) : project.scheduledBuildAt ? (
                  <TooltipContent>Build is already scheduled</TooltipContent>
                ) : null}
              </Tooltip>
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
