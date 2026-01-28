"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/api";
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
import { Button } from "@heroui/react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";

interface ProjectDetailClientProps {
  projectId: string;
}

export function ProjectDetailClient({ projectId }: ProjectDetailClientProps) {
  const { fullName, repo } = useRepo();
  const typedProjectId = projectId as Id<"projects">;
  const [isBuildModalOpen, setIsBuildModalOpen] = useState(false);

  const project = useQuery(api.projects.get, { id: typedProjectId });

  if (project === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
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
            <div className="flex items-center gap-1 text-default-500 text-sm">
              <IconGitBranch size={14} />
              {project.branchName}
            </div>
          )}
          {project.prUrl && (
            <Link
              href={project.prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-success-500 hover:underline text-sm"
            >
              <IconGitPullRequest size={14} />
              <span className="text-xs">View PR</span>
            </Link>
          )}
        </div>
      }
      headerRight={
        <Button
          color="primary"
          size="sm"
          startContent={<IconHammer size={16} />}
          onPress={() => setIsBuildModalOpen(true)}
        >
          Build Project
        </Button>
      }
    >
      <div className="flex-1 flex flex-col min-h-0 border-t border-neutral-200 dark:border-neutral-700 md:mt-3">
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
      </div>
      {!isDraftOrFinalized ? (
        <Modal
          isOpen={isBuildModalOpen}
          onClose={() => setIsBuildModalOpen(false)}
        >
          <ModalContent>
            <ModalHeader>Build Project</ModalHeader>
            <ModalBody>
              <p className="text-default-600">
                This will allow Eva to autonomously work through all tasks in
                sequence until the project is fully built.
              </p>
              <p className="text-sm text-default-500 mt-2">
                Best suited for projects with well-defined requirements. If Eva
                makes an error on an earlier task, it may carry forward into
                subsequent tasks.
              </p>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={() => setIsBuildModalOpen(false)}>
                Cancel
              </Button>
              <Button
                color="primary"
                startContent={<IconHammer size={16} />}
                onPress={() => setIsBuildModalOpen(false)}
              >
                Cook Eva, Cook
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      ) : null}
    </PageWrapper>
  );
}
