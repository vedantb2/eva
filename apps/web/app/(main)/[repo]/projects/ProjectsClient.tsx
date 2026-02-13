"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@conductor/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import type { Id } from "@conductor/backend";
import { PageWrapper } from "@/lib/components/PageWrapper";
import {
  Button,
  Input,
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
} from "@conductor/ui";
import { EmptyState } from "@/lib/components/ui/EmptyState";
import { NewProjectModal } from "@/lib/components/projects/NewProjectModal";
import {
  IconLayoutKanban,
  IconPlus,
  IconFilter,
  IconSortAscending,
  IconSortDescending,
  IconSearch,
  IconX,
  IconTimeline,
} from "@tabler/icons-react";
import { KanbanColumn } from "@/lib/components/kanban/KanbanColumn";
import {
  phaseConfig,
  PROJECT_PHASES,
  type ProjectPhase,
} from "@/lib/components/projects/ProjectPhaseBadge";
import { ProjectsTimeline } from "@/lib/components/projects/ProjectsTimeline";
import { encodeRepoSlug } from "@/lib/utils/repoUrl";
import { useState, useMemo } from "react";
import { useQueryStates } from "nuqs";
import {
  searchParser,
  phasesParser,
  sortFieldParser,
  sortDirParser,
  projectViewParser,
} from "@/lib/search-params";
import { ProjectCard } from "@/lib/components/projects/ProjectCard";

const SORT_FIELDS = [
  { key: "created" as const, label: "Date Created" },
  { key: "title" as const, label: "Title" },
];
type SortField = (typeof SORT_FIELDS)[number]["key"];

export function ProjectsClient() {
  const { repo, fullName } = useRepo();
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
          <Button size="sm" onClick={() => setIsCreating(true)}>
            <IconPlus size={16} />
            New Project
          </Button>
        }
      >
        <div className="flex flex-1 min-h-0 flex-col px-2 pb-2 pt-2">
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
            <div className="flex flex-col flex-1 min-h-0 gap-2">
              <div className="flex items-center justify-between gap-2 flex-wrap flex-shrink-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center rounded-lg border border-border overflow-hidden">
                    <Button
                      variant={view === "kanban" ? "secondary" : "ghost"}
                      size="icon"
                      className="h-8 w-8 rounded-none"
                      onClick={() => setParams({ view: "kanban" })}
                    >
                      <IconLayoutKanban size={16} />
                    </Button>
                    <Button
                      variant={view === "timeline" ? "secondary" : "ghost"}
                      size="icon"
                      className="h-8 w-8 rounded-none"
                      onClick={() => setParams({ view: "timeline" })}
                    >
                      <IconTimeline size={16} />
                    </Button>
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
                            <cfg.icon
                              size={16}
                              className={cfg.text + " mr-2"}
                            />
                            <span className={cfg.text}>{cfg.label}</span>
                          </DropdownMenuCheckboxItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="sm">
                        {sortDirection === "asc" ? (
                          <IconSortAscending size={16} />
                        ) : (
                          <IconSortDescending size={16} />
                        )}
                        {sortField === "created" ? "Date" : "Title"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuRadioGroup
                        value={sortField}
                        onValueChange={(v) =>
                          setParams({ sort: v as SortField })
                        }
                      >
                        {SORT_FIELDS.map((item) => (
                          <DropdownMenuRadioItem
                            key={item.key}
                            value={item.key}
                          >
                            {item.label}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                </div>
                <div className="relative w-1/2 mx-auto">
                  <IconSearch
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    placeholder="Search projects..."
                    className="pl-9 pr-8 h-8 text-sm"
                    value={searchQuery}
                    onChange={(e) => setParams({ q: e.target.value || null })}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setParams({ q: null })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <IconX size={14} />
                    </button>
                  )}
                </div>
              </div>
              {view === "kanban" ? (
                <div className="flex flex-1 min-h-0 items-stretch gap-1.5 overflow-x-auto overflow-y-hidden scrollbar">
                  {PROJECT_PHASES.filter((phase) =>
                    visiblePhases.has(phase),
                  ).map((phase) => (
                    <KanbanColumn
                      key={phase}
                      id={phase}
                      config={phaseConfig[phase]}
                      count={projectsByPhase[phase]?.length ?? 0}
                      droppable={false}
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
                          repoFullName={fullName}
                          createdAt={project._creationTime}
                          projectUrl={`/${encodeRepoSlug(fullName)}/projects/${project._id}`}
                          cardBg={phaseConfig[phase].cardBg}
                          onDelete={() =>
                            setProjectToDelete({
                              id: project._id,
                              title: project.title,
                            })
                          }
                        />
                      ))}
                      {(projectsByPhase[phase]?.length ?? 0) === 0 && (
                        <div className="flex flex-1 min-h-full items-center justify-center py-4 text-xs text-muted-foreground">
                          No projects
                        </div>
                      )}
                    </KanbanColumn>
                  ))}
                </div>
              ) : (
                <ProjectsTimeline
                  projects={filteredSorted}
                  repoFullName={fullName}
                />
              )}
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
            <Button variant="ghost" onClick={() => setProjectToDelete(null)}>
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
