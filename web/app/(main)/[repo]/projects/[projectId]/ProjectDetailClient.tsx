"use client";

import { useQuery } from "convex/react";
import { api } from "@/api";
import { useRepo } from "@/lib/contexts/RepoContext";
import { GenericId as Id } from "convex/values";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { ProjectTabs } from "@/lib/components/projects/ProjectTabs";
import { ProjectPhaseBadge } from "@/lib/components/projects/ProjectPhaseBadge";
import { ProjectActiveLayout } from "@/lib/components/projects/ProjectActiveLayout";
import { encodeRepoSlug } from "@/lib/utils/repoUrl";
import { IconGitBranch, IconGitPullRequest } from "@tabler/icons-react";
import Link from "next/link";

interface ProjectDetailClientProps {
  projectId: string;
}

export function ProjectDetailClient({ projectId }: ProjectDetailClientProps) {
  const { fullName, repo } = useRepo();
  const typedProjectId = projectId as Id<"projects">;

  const project = useQuery(api.projects.get, { id: typedProjectId });

  if (project === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600" />
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
      headerRight={
        <div className="flex items-center justify-between">
          <ProjectPhaseBadge phase={project.phase} />
          {(project.branchName || project.prUrl) && (
            <div className="flex items-center gap-3 text-sm ml-10">
              {project.branchName && (
                <div className="flex items-center gap-1 text-default-500">
                  <IconGitBranch size={14} />
                  {project.branchName}
                </div>
              )}
              {project.prUrl && (
                <Link
                  href={project.prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-success-500 hover:underline"
                >
                  <IconGitPullRequest size={14} />
                  <span className="text-xs">View PR</span>
                </Link>
              )}
            </div>
          )}
        </div>
      }
    >
      {isDraftOrFinalized ? (
        <ProjectTabs
          projectId={typedProjectId}
          projectPhase={project.phase}
          rawInput={project.rawInput}
          generatedSpec={project.generatedSpec}
          codebaseIndex={project.codebaseIndex}
          indexingStatus={project.indexingStatus}
          conversationHistory={project.conversationHistory}
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
    </PageWrapper>
  );
}
