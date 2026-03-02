"use client";

import { useState } from "react";
import type { FunctionReturnType } from "convex/server";
import type { Id } from "@conductor/backend";
import { api } from "@conductor/backend";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@conductor/ui";
import { IconChevronRight } from "@tabler/icons-react";
import {
  phaseConfig,
  PROJECT_PHASES,
  type ProjectPhase,
} from "@/lib/components/projects/ProjectPhaseBadge";
import { ProjectCard } from "@/lib/components/projects/ProjectCard";
import { useRepo } from "@/lib/contexts/RepoContext";

type Project = FunctionReturnType<typeof api.projects.list>[number];

interface ProjectsListViewProps {
  projectsByPhase: Record<ProjectPhase, Project[]>;
  visiblePhases: Set<ProjectPhase>;
  basePath: string;
  onDelete: (id: Id<"projects">, title: string) => void;
}

export function ProjectsListView({
  projectsByPhase,
  visiblePhases,
  basePath,
  onDelete,
}: ProjectsListViewProps) {
  const { owner, name } = useRepo();
  const [openSections, setOpenSections] = useState<Set<ProjectPhase>>(() => {
    // Default to only non-empty sections open; fall back to all if everything is empty.
    const nonEmpty = new Set(
      PROJECT_PHASES.filter((p) => (projectsByPhase[p] ?? []).length > 0),
    );
    return nonEmpty.size > 0 ? nonEmpty : new Set(PROJECT_PHASES);
  });

  const toggleSection = (phase: ProjectPhase) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(phase)) {
        next.delete(phase);
      } else {
        next.add(phase);
      }
      return next;
    });
  };

  return (
    <div className="flex-1 w-full overflow-y-auto scrollbar space-y-1">
      {PROJECT_PHASES.filter((phase) => visiblePhases.has(phase)).map(
        (phase) => {
          const cfg = phaseConfig[phase];
          const items = projectsByPhase[phase] ?? [];
          const Icon = cfg.icon;

          return (
            <Collapsible
              key={phase}
              open={openSections.has(phase)}
              onOpenChange={() => toggleSection(phase)}
            >
              <CollapsibleTrigger asChild>
                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted/50 sticky top-0 z-10 bg-background">
                  <IconChevronRight
                    size={14}
                    className={`text-muted-foreground transition-transform duration-200 ${
                      openSections.has(phase) ? "rotate-90" : ""
                    }`}
                  />
                  <Icon size={14} className={cfg.text} />
                  <span className={`text-sm font-medium ${cfg.text}`}>
                    {cfg.label}
                  </span>
                  <span className="text-xs text-muted-foreground/60 tabular-nums">
                    {items.length}
                  </span>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {items.length === 0 ? (
                  <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">
                    No projects
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5 px-1.5 pb-1.5">
                    {items.map((project) => (
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
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          );
        },
      )}
    </div>
  );
}
