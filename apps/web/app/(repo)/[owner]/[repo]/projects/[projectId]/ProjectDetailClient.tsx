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
import { ProjectPhaseBadge } from "@/lib/components/projects/ProjectPhaseBadge";
import { ProjectActiveLayout } from "@/lib/components/projects/ProjectActiveLayout";

import { IconGitBranch, IconHammer, IconRefresh } from "@tabler/icons-react";
import { ScheduleBuildPopover } from "@/lib/components/projects/ScheduleBuildPopover";

interface ProjectDetailClientProps {
  projectId: string;
}

export function ProjectDetailClient({ projectId }: ProjectDetailClientProps) {
  const { basePath, repo, installationId } = useRepo();
  const typedProjectId = projectId as Id<"projects">;
  const [isBuildModalOpen, setIsBuildModalOpen] = useState(false);
  const [isStartingBuild, setIsStartingBuild] = useState(false);
  const [isRerunModalOpen, setIsRerunModalOpen] = useState(false);
  const [isStartingRerun, setIsStartingRerun] = useState(false);
  const startBuild = useMutation(api.buildWorkflow.startBuild);
  const rerunBuild = useMutation(api.buildWorkflow.rerunBuild);

  const project = useQuery(api.projects.get, { id: typedProjectId });
  const streaming = useQuery(api.streaming.get, { entityId: projectId });
  const currentUserId = useQuery(api.auth.me);
  const isOwner = project ? currentUserId === project.userId : false;

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
        <div className="flex items-center gap-2">
          <span>{project.title}</span>
          <ProjectPhaseBadge phase={project.phase} />
        </div>
      }
      showBack
      fillHeight
      childPadding={false}
      headerCenter={
        project.branchName ? (
          <div className="flex items-center gap-1 text-muted-foreground text-sm">
            <IconGitBranch size={14} />
            {project.branchName}
          </div>
        ) : undefined
      }
      headerRight={
        !isDraftOrFinalized ? (
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsRerunModalOpen(true)}
                    disabled={
                      !isOwner ||
                      !!project.activeBuildWorkflowId ||
                      !!project.scheduledBuildAt
                    }
                  >
                    <IconRefresh size={16} />
                    Rerun
                  </Button>
                </div>
              </TooltipTrigger>
              {!isOwner ? (
                <TooltipContent>
                  Only the project owner can rerun
                </TooltipContent>
              ) : project.activeBuildWorkflowId ? (
                <TooltipContent>Build is currently running</TooltipContent>
              ) : project.scheduledBuildAt ? (
                <TooltipContent>Build is already scheduled</TooltipContent>
              ) : null}
            </Tooltip>
            <ScheduleBuildPopover
              projectId={typedProjectId}
              scheduledBuildAt={project.scheduledBuildAt}
              disabled={!isOwner || !!project.activeBuildWorkflowId}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    size="sm"
                    onClick={() => setIsBuildModalOpen(true)}
                    disabled={
                      !isOwner ||
                      !!project.scheduledBuildAt ||
                      !!project.activeBuildWorkflowId
                    }
                  >
                    <IconHammer size={16} />
                    Build Project
                  </Button>
                </div>
              </TooltipTrigger>
              {!isOwner ? (
                <TooltipContent>
                  Only the project owner can build
                </TooltipContent>
              ) : project.activeBuildWorkflowId ? (
                <TooltipContent>Build is currently running</TooltipContent>
              ) : project.scheduledBuildAt ? (
                <TooltipContent>Build is already scheduled</TooltipContent>
              ) : null}
            </Tooltip>
          </div>
        ) : null
      }
    >
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
            installationId={repo.installationId}
          />
        ) : (
          <ProjectActiveLayout
            projectId={typedProjectId}
            project={project}
            basePath={basePath}
            generatedSpec={project.generatedSpec}
            conversationHistory={project.conversationHistory}
            prUrl={project.prUrl}
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
                    installationId: repo.installationId,
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
      <Dialog
        open={isRerunModalOpen}
        onOpenChange={(v) => {
          if (!v) setIsRerunModalOpen(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rerun Project</DialogTitle>
          </DialogHeader>
          <div>
            <p className="text-muted-foreground">
              This will create a new branch, reset all tasks to todo, and rerun
              the entire build from scratch.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              All previous agent runs will be preserved. A new PR will be
              created on the new branch.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsRerunModalOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={isStartingRerun}
              onClick={async () => {
                setIsStartingRerun(true);
                try {
                  await rerunBuild({
                    projectId: typedProjectId,
                    installationId: repo.installationId,
                  });
                  setIsRerunModalOpen(false);
                } finally {
                  setIsStartingRerun(false);
                }
              }}
            >
              <IconRefresh size={16} />
              {isStartingRerun ? "Starting..." : "Rerun build"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
