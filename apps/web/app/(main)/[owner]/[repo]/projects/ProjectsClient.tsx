"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import type { Id } from "@conductor/backend";
import { PageWrapper } from "@/lib/components/PageWrapper";
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Spinner,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@conductor/ui";
import { ToggleSearch } from "@/lib/components/ui/ToggleSearch";
import { EmptyState } from "@/lib/components/ui/EmptyState";
import { NewProjectModal } from "@/lib/components/projects/NewProjectModal";
import {
  IconLayoutKanban,
  IconPlus,
  IconFilter,
  IconSortAscending,
  IconSortDescending,
  IconTimeline,
  IconList,
} from "@tabler/icons-react";
import { KanbanColumn } from "@/lib/components/kanban/KanbanColumn";
import {
  phaseConfig,
  PROJECT_PHASES,
  type ProjectPhase,
} from "@/lib/components/projects/ProjectPhaseBadge";
import { ProjectsTimeline } from "@/lib/components/projects/ProjectsTimeline";

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
import { ProjectCard } from "@/lib/components/projects/ProjectCard";
import { ProjectsListView } from "@/lib/components/projects/ProjectsListView";

const SORT_FIELDS = [
  { key: "created" as const, label: "Date Created" },
  { key: "title" as const, label: "Title" },
];
type SortField = (typeof SORT_FIELDS)[number]["key"];

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
  const visiblePhases = useMemo(
    () => new Set(phases as ProjectPhase[]),
    [phases],
  );
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
      .filter((p) => visiblePhases.has(p.phase as ProjectPhase))
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
    return PROJECT_PHASES.reduce(
      (acc, phase) => {
        acc[phase] = filteredSorted.filter((p) => p.phase === phase);
        return acc;
      },
      {} as Record<ProjectPhase, typeof filteredSorted>,
    );
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
              <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                <div className="flex items-center rounded-lg border border-border overflow-hidden">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={view === "kanban" ? "secondary" : "ghost"}
                        size="icon"
                        className="motion-press h-8 w-8 rounded-none hover:scale-[1.03] active:scale-[0.97]"
                        onClick={() => setParams({ view: "kanban" })}
                      >
                        <IconLayoutKanban size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Kanban view</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={view === "timeline" ? "secondary" : "ghost"}
                        size="icon"
                        className="motion-press h-8 w-8 rounded-none hover:scale-[1.03] active:scale-[0.97]"
                        onClick={() => setParams({ view: "timeline" })}
                      >
                        <IconTimeline size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Timeline view</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={view === "list" ? "secondary" : "ghost"}
                        size="icon"
                        className="motion-press h-8 w-8 rounded-none hover:scale-[1.03] active:scale-[0.97]"
                        onClick={() => setParams({ view: "list" })}
                      >
                        <IconList size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>List view</TooltipContent>
                  </Tooltip>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="sm">
                      <IconFilter size={16} />
                      {visiblePhases.size === PROJECT_PHASES.length
                        ? "All Phases"
                        : `${visiblePhases.size} Phases`}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {PROJECT_PHASES.map((p) => {
                      const cfg = phaseConfig[p];
                      return (
                        <DropdownMenuCheckboxItem
                          key={p}
                          checked={visiblePhases.has(p)}
                          onCheckedChange={() => handlePhaseToggle(p)}
                          onSelect={(e) => e.preventDefault()}
                        >
                          <cfg.icon size={16} className={cfg.text + " mr-2"} />
                          <span className={cfg.text}>{cfg.label}</span>
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="sm">
                      {sortField === "created" ? "Date" : "Title"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuRadioGroup
                      value={sortField}
                      onValueChange={(v) => setParams({ sort: v as SortField })}
                    >
                      {SORT_FIELDS.map((item) => (
                        <DropdownMenuRadioItem key={item.key} value={item.key}>
                          {item.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        setParams({ dir: dir === "asc" ? "desc" : "asc" })
                      }
                    >
                      {sortDirection === "asc" ? (
                        <IconSortAscending size={16} />
                      ) : (
                        <IconSortDescending size={16} />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {sortDirection === "asc"
                      ? "Ascending - click to reverse"
                      : "Descending - click to reverse"}
                  </TooltipContent>
                </Tooltip>
              </div>
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
                    {PROJECT_PHASES.filter((phase) =>
                      visiblePhases.has(phase),
                    ).map((phase) => (
                      <KanbanColumn
                        key={phase}
                        id={phase}
                        config={phaseConfig[phase]}
                        count={projectsByPhase[phase]?.length ?? 0}
                        droppable={false}
                        emptyLabel="No projects"
                      >
                        {projectsByPhase[phase]?.map((project) => (
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
                            onDelete={() =>
                              setProjectToDelete({
                                id: project._id,
                                title: project.title,
                              })
                            }
                          />
                        ))}
                      </KanbanColumn>
                    ))}
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
      <Dialog
        open={!!projectToDelete}
        onOpenChange={(v) => {
          if (!v) setProjectToDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
          </DialogHeader>
          <div>
            <p className="text-muted-foreground">
              Are you sure you want to delete{" "}
              <strong>{projectToDelete?.title}</strong>?
            </p>
            <div className="mt-3 p-3 bg-warning-bg rounded-lg">
              <p className="text-sm text-warning">
                This will permanently delete the project and all associated
                tasks, subtasks, agent runs, and dependencies.
              </p>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setProjectToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
