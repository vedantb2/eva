"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import type { Id } from "@conductor/backend";
import { PageWrapper } from "@/lib/components/PageWrapper";
import { Button, Spinner } from "@conductor/ui";
import { ToggleSearch } from "@/lib/components/ui/ToggleSearch";
import { EmptyState } from "@/lib/components/ui/EmptyState";
import { NewProjectModal } from "@/lib/components/projects/NewProjectModal";
import { IconLayoutKanban, IconPlus } from "@tabler/icons-react";
import {
  PROJECT_PHASES,
  type ProjectPhase,
} from "@/lib/components/projects/ProjectPhaseBadge";
import { ProjectsTimeline } from "@/lib/components/projects/ProjectsTimeline";
import { ProjectsListView } from "@/lib/components/projects/ProjectsListView";
import { ProjectsToolbar } from "./_components/ProjectsToolbar";
import { ProjectsKanbanView } from "./_components/ProjectsKanbanView";
import { ProjectDeleteDialog } from "./_components/ProjectDeleteDialog";

import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useQueryStates } from "nuqs";
import {
  searchParser,
  phasesParser,
  sortFieldParser,
  sortDirParser,
  projectViewParser,
} from "@/lib/search-params";

export function ProjectsClient() {
  const { repo, basePath, owner, name } = useRepo();
  const projects = useQuery(api.projects.list, { repoId: repo._id });
  const deleteProject = useMutation(api.projects.deleteCascade);
  const [isCreating, setIsCreating] = useState(false);
  const [{ q, phases, sort, dir, view }, setParams] = useQueryStates({
    q: searchParser,
    phases: phasesParser,
    sort: sortFieldParser,
    dir: sortDirParser,
    view: projectViewParser,
  });
  const searchQuery = q;
  const visiblePhases = useMemo(() => new Set<ProjectPhase>(phases), [phases]);
  const sortField = sort;
  const sortDirection = dir;
  const [projectToDelete, setProjectToDelete] = useState<{
    id: Id<"projects">;
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredSorted = useMemo(() => {
    if (!projects) return [];
    const query = searchQuery.toLowerCase().trim();
    return projects
      .filter((p) => visiblePhases.has(p.phase))
      .filter((p) => {
        if (!query) return true;
        return (
          p.title.toLowerCase().includes(query) ||
          p.rawInput?.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case "created":
            comparison = a._creationTime - b._creationTime;
            break;
          case "title":
            comparison = a.title.localeCompare(b.title);
            break;
        }
        return sortDirection === "asc" ? comparison : -comparison;
      });
  }, [projects, sortField, sortDirection, searchQuery, visiblePhases]);

  const projectsByPhase = useMemo(() => {
    const initial: Record<ProjectPhase, typeof filteredSorted> = {
      draft: [],
      finalized: [],
      active: [],
      completed: [],
    };
    return PROJECT_PHASES.reduce((acc, phase) => {
      acc[phase] = filteredSorted.filter((p) => p.phase === phase);
      return acc;
    }, initial);
  }, [filteredSorted]);

  const handleDelete = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    try {
      await deleteProject({ id: projectToDelete.id });
      setProjectToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePhaseToggle = (phase: ProjectPhase) => {
    const next = new Set(visiblePhases);
    if (next.has(phase)) {
      if (next.size === 1) return;
      next.delete(phase);
    } else {
      next.add(phase);
    }
    setParams({ phases: [...next] });
  };

  return (
    <>
      <PageWrapper
        title="Projects"
        fillHeight
        childPadding={false}
        headerRight={
          <div className="flex items-center gap-2">
            <ToggleSearch
              value={searchQuery}
              onChange={(v) => setParams({ q: v })}
              placeholder="Search projects..."
              tooltipLabel="Search projects"
              visible={projects !== undefined && projects.length > 0}
            />
            <Button
              size="sm"
              className="motion-press hover:scale-[1.01] active:scale-[0.99]"
              onClick={() => setIsCreating(true)}
            >
              <IconPlus size={16} />
              New Project
            </Button>
          </div>
        }
      >
        <div className="flex flex-1 min-h-0 min-w-0 flex-col p-4">
          {projects === undefined ? (
            <div className="flex flex-1 items-center justify-center">
              <Spinner />
            </div>
          ) : projects.length === 0 ? (
            <EmptyState
              icon={
                <IconLayoutKanban size={24} className="text-muted-foreground" />
              }
              title="No projects yet"
              description="Create a project to describe a feature and let AI help you break it down into tasks"
              actionLabel="Create Project"
              onAction={() => setIsCreating(true)}
            />
          ) : (
            <div className="flex flex-col flex-1 min-h-0 min-w-0 gap-4">
              <ProjectsToolbar
                view={view}
                onViewChange={(v) => setParams({ view: v })}
                visiblePhases={visiblePhases}
                onPhaseToggle={handlePhaseToggle}
                sortField={sortField}
                onSortChange={(v) => setParams({ sort: v })}
                sortDirection={sortDirection}
                onSortDirectionToggle={() =>
                  setParams({ dir: dir === "asc" ? "desc" : "asc" })
                }
              />
              <AnimatePresence initial={false} mode="wait">
                {view === "kanban" ? (
                  <motion.div
                    key="projects-kanban-view"
                    className="flex flex-1 min-h-0 items-stretch gap-3 overflow-x-auto overflow-y-hidden scrollbar"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ProjectsKanbanView
                      projectsByPhase={projectsByPhase}
                      visiblePhases={visiblePhases}
                      owner={owner}
                      name={name}
                      basePath={basePath}
                      onDelete={(id, title) =>
                        setProjectToDelete({ id, title })
                      }
                    />
                  </motion.div>
                ) : view === "timeline" ? (
                  <motion.div
                    key="projects-timeline-view"
                    className="flex flex-1 min-h-0 min-w-0"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ProjectsTimeline
                      projects={filteredSorted}
                      basePath={basePath}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="projects-list-view"
                    className="flex flex-1 min-h-0"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ProjectsListView
                      projectsByPhase={projectsByPhase}
                      visiblePhases={visiblePhases}
                      basePath={basePath}
                      onDelete={(id, title) =>
                        setProjectToDelete({ id, title })
                      }
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </PageWrapper>
      <NewProjectModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
      />
      <ProjectDeleteDialog
        project={projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}
