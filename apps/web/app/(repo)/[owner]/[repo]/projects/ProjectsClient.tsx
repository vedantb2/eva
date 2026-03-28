"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useQuery } from "convex-helpers/react/cache";
import { useMutation } from "convex/react";
import { api } from "@conductor/backend";
import type { Id } from "@conductor/backend";
import { useQueryStates } from "nuqs";
import { useRouter } from "next/navigation";
import { useRepo } from "@/lib/contexts/RepoContext";
import { PageWrapper } from "@/lib/components/PageWrapper";
import {
  Button,
  Spinner,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
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
import {
  PROJECT_PHASES,
  phaseConfig,
  type ProjectPhase,
} from "@/lib/components/projects/ProjectPhaseBadge";
import { ProjectsTimeline } from "@/lib/components/projects/ProjectsTimeline";
import { ProjectsListView } from "@/lib/components/projects/ProjectsListView";
import { ProjectsKanbanView } from "./_components/ProjectsKanbanView";
import { ProjectDeleteDialog } from "./_components/ProjectDeleteDialog";
import { SORT_FIELDS, type SortField } from "./_components/ProjectsToolbar";
import {
  searchParser,
  phasesParser,
  sortFieldParser,
  sortDirParser,
  projectViewParser,
} from "@/lib/search-params";

type ProjectView = "kanban" | "timeline" | "list";

const VIEW_OPTIONS: {
  key: ProjectView;
  icon: typeof IconLayoutKanban;
  label: string;
}[] = [
  { key: "kanban", icon: IconLayoutKanban, label: "Kanban view" },
  { key: "timeline", icon: IconTimeline, label: "Timeline view" },
  { key: "list", icon: IconList, label: "List view" },
];

function isSortField(value: string): value is SortField {
  return SORT_FIELDS.some((f) => f.key === value);
}

export function ProjectsClient() {
  const { repo, basePath, owner, name } = useRepo();
  const projects = useQuery(api.projects.list, { repoId: repo._id });
  const deleteProject = useMutation(api.projects.deleteCascade);
  const router = useRouter();
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
  const hasProjects = projects !== undefined && projects.length > 0;

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
      cancelled: [],
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

  const handleOpenProject = (id: string) => {
    router.push(`${basePath}/projects/${id}`);
  };

  const toolbarContent = (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <ToggleSearch
        value={searchQuery}
        onChange={(v) => setParams({ q: v })}
        placeholder="Search projects..."
        tooltipLabel="Search projects"
        visible={hasProjects}
      />
      {hasProjects && (
        <div className="flex items-center rounded-lg bg-muted/40 overflow-hidden">
          {VIEW_OPTIONS.map((opt) => (
            <Tooltip key={opt.key}>
              <TooltipTrigger asChild>
                <Button
                  variant={view === opt.key ? "secondary" : "ghost"}
                  size="icon"
                  className="motion-press h-8 w-8 rounded-none hover:scale-[1.03] active:scale-[0.97]"
                  onClick={() => setParams({ view: opt.key })}
                >
                  <opt.icon size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{opt.label}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      )}
      {hasProjects && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className="hidden sm:inline-flex"
            >
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
      )}
      {hasProjects && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 sm:hidden"
            >
              <IconFilter size={16} />
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
      )}
      {hasProjects && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8"
              onClick={() => setParams({ dir: dir === "asc" ? "desc" : "asc" })}
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
      )}
      <Button
        size="sm"
        className="motion-press hover:scale-[1.01] active:scale-[0.99]"
        onClick={() => setIsCreating(true)}
      >
        <IconPlus size={16} />
        <span className="hidden sm:inline">New Project</span>
      </Button>
    </div>
  );

  return (
    <>
      <PageWrapper
        title="Projects"
        fillHeight
        childPadding={false}
        headerRight={toolbarContent}
      >
        <div className="relative flex min-w-0 flex-1 min-h-0 flex-col overflow-hidden p-3 pt-0">
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
            <AnimatePresence initial={false} mode="wait">
              {view === "kanban" ? (
                <motion.div
                  key="projects-kanban-view"
                  className="flex flex-1 min-h-0 items-stretch gap-3 overflow-x-auto overflow-y-hidden scrollbar [&>*]:min-w-[220px] sm:[&>*]:min-w-0"
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
                    onOpenProject={handleOpenProject}
                    onDelete={(id, title) => setProjectToDelete({ id, title })}
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
                    onOpenProject={handleOpenProject}
                    onDelete={(id, title) => setProjectToDelete({ id, title })}
                  />
                </motion.div>
              )}
            </AnimatePresence>
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
