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
} from "@conductor/ui";
import { Skeleton } from "@/lib/components/ui/Skeleton";
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
} from "@tabler/icons-react";
import { KanbanColumn } from "@/lib/components/kanban/KanbanColumn";
import {
  phaseConfig,
  PROJECT_PHASES,
  type ProjectPhase,
} from "@/lib/components/projects/ProjectPhaseBadge";
import { encodeRepoSlug } from "@/lib/utils/repoUrl";
import { useState, useMemo } from "react";
import { ProjectCard } from "@/lib/components/projects/ProjectCard";

const SORT_FIELDS = [
  { key: "created" as const, label: "Date Created" },
  { key: "title" as const, label: "Title" },
];
type SortField = (typeof SORT_FIELDS)[number]["key"];
type SortDirection = "asc" | "desc";

export function ProjectsClient() {
  const { repo, fullName } = useRepo();
  const projects = useQuery(api.projects.list, { repoId: repo._id });
  const deleteProject = useMutation(api.projects.deleteCascade);
  const [isCreating, setIsCreating] = useState(false);
  const [visiblePhases, setVisiblePhases] = useState<Set<ProjectPhase>>(
    new Set(PROJECT_PHASES),
  );
  const [sortField, setSortField] = useState<SortField>("created");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [projectToDelete, setProjectToDelete] = useState<{
    id: Id<"projects">;
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const projectsByPhase = useMemo(() => {
    if (!projects) return {} as Record<ProjectPhase, typeof projects>;
    const query = searchQuery.toLowerCase().trim();
    const grouped = PROJECT_PHASES.reduce(
      (acc, phase) => {
        acc[phase] = projects
          .filter((p) => p.phase === phase)
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
        return acc;
      },
      {} as Record<ProjectPhase, typeof projects>,
    );
    return grouped;
  }, [projects, sortField, sortDirection, searchQuery]);

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
    setVisiblePhases((prev) => {
      const next = new Set(prev);
      if (next.has(phase)) {
        if (next.size === 1) return prev;
        next.delete(phase);
      } else {
        next.add(phase);
      }
      return next;
    });
  };

  return (
    <>
      <PageWrapper
        title="Projects"
        fillHeight
        headerRight={
          <Button size="sm" onClick={() => setIsCreating(true)}>
            <IconPlus size={16} />
            New Project
          </Button>
        }
      >
        {projects === undefined ? (
          <div className="flex items-stretch gap-2 flex-1 min-h-0">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex-1 min-w-0 bg-secondary rounded-md p-2 space-y-2"
              >
                <Skeleton className="h-6 w-24" />
                {[1, 2].map((j) => (
                  <Skeleton key={j} className="h-24 rounded-md" />
                ))}
              </div>
            ))}
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
          <div className="flex flex-col flex-1 min-h-0 gap-4">
            <div className="flex items-center justify-between gap-2 flex-wrap flex-shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="sm">
                      <IconFilter size={16} />
                      {visiblePhases.size === PROJECT_PHASES.length
                        ? "All Columns"
                        : `${visiblePhases.size} Columns`}
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
                      onValueChange={(v) => setSortField(v as SortField)}
                    >
                      {SORT_FIELDS.map((item) => (
                        <DropdownMenuRadioItem key={item.key} value={item.key}>
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
                    setSortDirection((d) => (d === "asc" ? "desc" : "asc"))
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <IconX size={14} />
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-stretch gap-2 overflow-x-auto scrollbar flex-1 min-h-0">
              {PROJECT_PHASES.filter((phase) => visiblePhases.has(phase)).map(
                (phase) => (
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
                      <p className="text-xs text-muted-foreground text-center py-4">
                        No projects
                      </p>
                    )}
                  </KanbanColumn>
                ),
              )}
            </div>
          </div>
        )}
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
