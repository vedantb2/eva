"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/api";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/lib/components/ui/tooltip";
import { useRepo } from "@/lib/contexts/RepoContext";
import { GenericId as Id } from "convex/values";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { ProjectTabs } from "@/lib/components/projects/ProjectTabs";
import { ProjectPhaseBadge } from "@/lib/components/projects/ProjectPhaseBadge";
import { ProjectActiveLayout } from "@/lib/components/projects/ProjectActiveLayout";
import { encodeRepoSlug } from "@/lib/utils/repoUrl";
import {
  IconGitBranch,
  IconGitPullRequest,
  IconHammer,
} from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "@/lib/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/lib/components/ui/dialog";

interface ProjectDetailClientProps {
  projectId: string;
}

export function ProjectDetailClient({ projectId }: ProjectDetailClientProps) {
  const { fullName, repo } = useRepo();
  const typedProjectId = projectId as Id<"projects">;
  const [isBuildModalOpen, setIsBuildModalOpen] = useState(false);

  const project = useQuery(api.projects.get, { id: typedProjectId });
  const streaming = useQuery(api.streaming.get, { entityId: projectId });
  const currentUserId = useQuery(api.auth.me);
  const isOwner = project ? currentUserId === project.userId : false;

  if (project === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (project === null) {
    return (
      <PageWrapper>
        <div className="py-12 text-center">
          <p className="text-neutral-500">Project not found</p>
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
      headerCenter={
        <div className="flex items-center gap-3">
          <ProjectPhaseBadge phase={project.phase} />
          {project.branchName && (
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <IconGitBranch size={14} />
              {project.branchName}
            </div>
          )}
          {project.prUrl && (
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full"
              asChild
            >
              <Link
                href={project.prUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <IconGitPullRequest size={14} />
                <span className="text-xs">View PR</span>
              </Link>
            </Button>
          )}
        </div>
      }
      headerRight={
        !isDraftOrFinalized ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button
                  size="sm"
                  onClick={() => setIsBuildModalOpen(true)}
                  disabled={!isOwner}
                >
                  <IconHammer size={16} />
                  Build Project
                </Button>
              </div>
            </TooltipTrigger>
            {!isOwner && (
              <TooltipContent>Only the project owner can build</TooltipContent>
            )}
          </Tooltip>
        ) : null
      }
    >
      <div className="flex-1 flex flex-col min-h-0 border-t border-neutral-200 dark:border-neutral-700">
        {isDraftOrFinalized ? (
          <ProjectTabs
            projectId={typedProjectId}
            projectPhase={project.phase}
            rawInput={project.rawInput}
            generatedSpec={project.generatedSpec}
            conversationHistory={project.conversationHistory}
            streamingActivity={streaming?.currentActivity}
            repoSlug={encodeRepoSlug(fullName)}
            repoId={repo._id}
            installationId={repo.installationId}
          />
        ) : (
          <ProjectActiveLayout
            projectId={typedProjectId}
            project={project}
            repoSlug={encodeRepoSlug(fullName)}
          />
        )}
      </div>

      <Dialog open={isBuildModalOpen} onOpenChange={(v) => { if (!v) setIsBuildModalOpen(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Build Project</DialogTitle>
          </DialogHeader>
          <div>
            <p className="text-foreground/80">
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
            <Button variant="secondary" onClick={() => setIsBuildModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                await fetch("/api/inngest/send", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: "project/build.requested",
                    data: { projectId: typedProjectId },
                  }),
                });
                setIsBuildModalOpen(false);
              }}
            >
              <IconHammer size={16} />
              Start cooking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
