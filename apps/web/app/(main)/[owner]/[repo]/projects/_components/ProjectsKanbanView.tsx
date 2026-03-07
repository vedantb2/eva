import type { FunctionReturnType } from "convex/server";
import type { Id } from "@conductor/backend";
import { api } from "@conductor/backend";
import { KanbanColumn } from "@/lib/components/kanban/KanbanColumn";
import {
  phaseConfig,
  PROJECT_PHASES,
  type ProjectPhase,
} from "@/lib/components/projects/ProjectPhaseBadge";
import { ProjectCard } from "@/lib/components/projects/ProjectCard";

type Project = FunctionReturnType<typeof api.projects.list>[number];

interface ProjectsKanbanViewProps {
  projectsByPhase: Record<ProjectPhase, Project[]>;
  visiblePhases: Set<ProjectPhase>;
  owner: string;
  name: string;
  basePath: string;
  onDelete: (id: Id<"projects">, title: string) => void;
}

export function ProjectsKanbanView({
  projectsByPhase,
  visiblePhases,
  owner,
  name,
  basePath,
  onDelete,
}: ProjectsKanbanViewProps) {
  return (
    <>
      {PROJECT_PHASES.filter((phase) => visiblePhases.has(phase)).map(
        (phase) => (
          <KanbanColumn
            key={phase}
            id={phase}
            config={phaseConfig[phase]}
            count={projectsByPhase[phase].length}
            droppable={false}
            emptyLabel="No projects"
          >
            {projectsByPhase[phase].map((project) => (
              <ProjectCard
                key={project._id}
                projectId={project._id}
                userId={project.userId}
                title={project.title}
                description={project.description}
                rawInput={project.rawInput}
                branchName={project.branchName}
                repoFullName={`${owner}/${name}`}
                createdAt={project._creationTime}
                projectUrl={`${basePath}/projects/${project._id}`}
                accentColor={phaseConfig[phase].bar}
                onDelete={() => onDelete(project._id, project.title)}
              />
            ))}
          </KanbanColumn>
        ),
      )}
    </>
  );
}
