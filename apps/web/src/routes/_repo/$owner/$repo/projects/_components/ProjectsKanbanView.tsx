import { useCallback, useState } from "react";
import type { RefCallback } from "react";
import type { FunctionReturnType } from "convex/server";
import type { Id } from "@conductor/backend";
import { api } from "@conductor/backend";
import { AnimatePresence, motion } from "motion/react";
import { Virtuoso } from "react-virtuoso";
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
  onOpenProject: (id: string) => void;
  onDelete: (id: Id<"projects">, title: string) => void;
}

export function ProjectsKanbanView({
  projectsByPhase,
  visiblePhases,
  owner,
  name,
  onOpenProject,
  onDelete,
}: ProjectsKanbanViewProps) {
  return (
    <AnimatePresence initial={false}>
      {PROJECT_PHASES.filter((phase) => visiblePhases.has(phase)).map(
        (phase) => (
          <motion.div
            key={phase}
            layout
            className="flex min-h-0 min-w-[70vw] sm:min-w-0 flex-1 self-stretch"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
          >
            <VirtualProjectColumn
              phase={phase}
              projects={projectsByPhase[phase]}
              owner={owner}
              name={name}
              onOpenProject={onOpenProject}
              onDelete={onDelete}
            />
          </motion.div>
        ),
      )}
    </AnimatePresence>
  );
}

function VirtualProjectColumn({
  phase,
  projects,
  owner,
  name,
  onOpenProject,
  onDelete,
}: {
  phase: ProjectPhase;
  projects: Project[];
  owner: string;
  name: string;
  onOpenProject: (id: string) => void;
  onDelete: (id: Id<"projects">, title: string) => void;
}) {
  const [scrollParent, setScrollParent] = useState<HTMLDivElement | null>(null);

  const scrollRef: RefCallback<HTMLDivElement> = useCallback(
    (node: HTMLDivElement | null) => {
      setScrollParent(node);
    },
    [],
  );

  return (
    <KanbanColumn
      id={phase}
      config={phaseConfig[phase]}
      count={projects.length}
      droppable={false}
      emptyLabel="No projects"
      scrollRef={scrollRef}
    >
      {scrollParent && projects.length > 0 && (
        <Virtuoso
          customScrollParent={scrollParent}
          totalCount={projects.length}
          overscan={200}
          itemContent={(index) => {
            const project = projects[index];
            return (
              <div className="pb-1.5">
                <ProjectCard
                  projectId={project._id}
                  userId={project.userId}
                  title={project.title}
                  description={project.description}
                  rawInput={project.rawInput}
                  branchName={project.branchName}
                  repoFullName={`${owner}/${name}`}
                  createdAt={project._creationTime}
                  accentColor={phaseConfig[phase].bar}
                  members={project.members}
                  projectLead={project.projectLead}
                  phase={phase}
                  onClick={() => onOpenProject(project._id)}
                  onDelete={() => onDelete(project._id, project.title)}
                />
              </div>
            );
          }}
        />
      )}
    </KanbanColumn>
  );
}
