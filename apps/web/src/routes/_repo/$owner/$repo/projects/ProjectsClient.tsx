import { useState } from "react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useMutation } from "convex/react";
import { api } from "@eva/backend";
import type { Id } from "@eva/backend";
import { useRepo } from "@/lib/contexts/RepoContext";
import { useRoutePageTitle } from "@/lib/contexts/PageTitleContext";
import {
  EmptyState,
  PageHeader,
  PageHeaderActions,
  PageHeaderTitle,
  Skeleton,
} from "@eva/ui";
import { NewProjectModal } from "@/lib/components/projects/NewProjectModal";
import { IconLayoutKanban } from "@tabler/icons-react";
import {
  PROJECT_PHASES,
  type ProjectPhase,
} from "@/lib/components/projects/ProjectPhaseBadge";
import { priorityCompare } from "@/lib/components/priority/priorityMeta";
import { ProjectsViewSwitcher } from "./_components/ProjectsViewSwitcher";
import { ProjectDeleteDialog } from "./_components/ProjectDeleteDialog";
import { ActiveFiltersBar } from "./_components/ActiveFiltersBar";
import { ProjectsToolbar } from "./_components/ProjectsToolbar";
import { SORT_FIELD_LABELS, useProjectFilters } from "./_utils";

export function ProjectsClient() {
  const { repo, basePath, owner, name } = useRepo();
  const projects = useQuery(api.projects.list, { repoId: repo._id });
  const deleteProject = useMutation(
    api.projects.deleteCascade,
  ).withOptimisticUpdate((localStore, args) => {
    const currentList = localStore.getQuery(api.projects.list, {
      repoId: repo._id,
    });
    if (currentList !== undefined) {
      localStore.setQuery(
        api.projects.list,
        { repoId: repo._id },
        currentList.filter((p) => p._id !== args.id),
      );
    }
  });

  // The page header lives in this pane, but the mobile top bar renders the
  // route title from context — so it still has to be published from here.
  useRoutePageTitle("Projects");

  const [isCreating, setIsCreating] = useState(false);
  const [
    { q, view, hiddenPhases, sortField, sortDir, timelineRange, timelineZoom },
    setParams,
  ] = useProjectFilters();
  const searchQuery = q;
  // Derive the visible set from the persisted blocklist so new phases show by
  // default and "all visible" is independent of how many phases exist.
  const hiddenPhaseSet = new Set<ProjectPhase>(hiddenPhases);
  const visiblePhases = new Set<ProjectPhase>(
    PROJECT_PHASES.filter((p) => !hiddenPhaseSet.has(p)),
  );
  const [projectToDelete, setProjectToDelete] = useState<{
    id: Id<"projects">;
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const hasProjects = projects !== undefined && projects.length > 0;

  const filteredSorted = (() => {
    if (!projects) return [];
    const query = searchQuery.toLowerCase().trim();
    return projects
      .filter((p) => {
        if (!visiblePhases.has(p.phase)) return false;
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
          case "priority":
            comparison = priorityCompare(a.priority, b.priority);
            break;
        }
        return sortDir === "asc" ? comparison : -comparison;
      });
  })();

  const projectsByPhaseInitial: Record<ProjectPhase, typeof filteredSorted> = {
    draft: [],
    finalized: [],
    in_progress: [],
    business_review: [],
    code_review: [],
    completed: [],
    cancelled: [],
  };
  const projectsByPhase = PROJECT_PHASES.reduce((acc, phase) => {
    acc[phase] = filteredSorted.filter((p) => p.phase === phase);
    return acc;
  }, projectsByPhaseInitial);

  const handleDelete = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    try {
      await deleteProject({ id: projectToDelete.id });
      setProjectToDelete(null);
    } catch (error) {
      setIsDeleting(false);
      throw error;
    }
    setIsDeleting(false);
  };

  const handlePhaseToggle = (phase: ProjectPhase) => {
    const hidden = new Set<ProjectPhase>(hiddenPhases);
    if (hidden.has(phase)) {
      hidden.delete(phase);
    } else {
      // Keep at least one phase visible.
      if (visiblePhases.size === 1) return;
      hidden.add(phase);
    }
    setParams({ hiddenPhases: [...hidden] });
  };

  const hasActiveFilters =
    hiddenPhases.length > 0 || sortField !== "created" || sortDir !== "desc";

  const clearAllFilters = () => {
    setParams({
      hiddenPhases: [],
      sortField: "created",
      sortDir: "desc",
    });
  };

  const activeFilterLabels: Array<{ key: string; label: string }> = [];
  if (hiddenPhases.length > 0) {
    activeFilterLabels.push({
      key: "phases",
      label: `${visiblePhases.size} Phase${visiblePhases.size !== 1 ? "s" : ""}`,
    });
  }
  if (sortField !== "created") {
    activeFilterLabels.push({
      key: "sortField",
      label: `Sort: ${SORT_FIELD_LABELS[sortField]}`,
    });
  }
  if (sortDir !== "desc") {
    activeFilterLabels.push({ key: "sortDir", label: "Ascending" });
  }

  const clearFilter = (key: string) => {
    switch (key) {
      case "phases":
        setParams({ hiddenPhases: [] });
        break;
      case "sortField":
        setParams({ sortField: "created" });
        break;
      case "sortDir":
        setParams({ sortDir: "desc" });
        break;
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <PageHeader>
        <PageHeaderTitle>Projects</PageHeaderTitle>
        <PageHeaderActions>
          <ProjectsToolbar
            searchQuery={searchQuery}
            onSearchChange={(v) => setParams({ q: v ?? "" })}
            hasProjects={hasProjects}
            view={view}
            onViewChange={(v) => setParams({ view: v })}
            sortField={sortField}
            sortDir={sortDir}
            onSortFieldChange={(v) => setParams({ sortField: v })}
            onSortDirChange={(v) => setParams({ sortDir: v })}
            visiblePhases={visiblePhases}
            onPhaseToggle={handlePhaseToggle}
            hasActiveFilters={hasActiveFilters}
            onClearAllFilters={clearAllFilters}
            onNewProject={() => setIsCreating(true)}
          />
        </PageHeaderActions>
      </PageHeader>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden p-3 pt-0">
        {activeFilterLabels.length > 0 && (
          <ActiveFiltersBar
            filters={activeFilterLabels}
            onClearFilter={clearFilter}
            onClearAll={clearAllFilters}
          />
        )}
        {projects === undefined ? (
          <div
            className="flex flex-1 min-h-[24rem] flex-col gap-3"
            aria-busy="true"
            aria-label="Loading projects"
          >
            <div className="flex flex-1 gap-3 overflow-hidden">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="min-w-[220px] flex-1 border border-border"
                />
              ))}
            </div>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <EmptyState
              icon={
                <IconLayoutKanban size={24} className="text-muted-foreground" />
              }
              title="No projects yet"
              description="Create a project to describe a feature and let AI help you break it down into tasks"
              actionLabel="Create Project"
              onAction={() => setIsCreating(true)}
            />
          </div>
        ) : filteredSorted.length === 0 ? (
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <EmptyState
              icon={
                <IconLayoutKanban size={24} className="text-muted-foreground" />
              }
              title="No matching projects"
              description="Try clearing filters to see all projects."
              actionLabel="Clear filters"
              onAction={clearAllFilters}
              animate={false}
            />
          </div>
        ) : (
          <ProjectsViewSwitcher
            view={view}
            filteredSorted={filteredSorted}
            projectsByPhase={projectsByPhase}
            visiblePhases={visiblePhases}
            owner={owner}
            name={name}
            basePath={basePath}
            onDelete={(id, title) => setProjectToDelete({ id, title })}
            timelineRange={timelineRange}
            timelineZoom={timelineZoom}
            onTimelineRangeChange={(r) => setParams({ timelineRange: r })}
            onTimelineZoomChange={(z) => setParams({ timelineZoom: z })}
          />
        )}
      </div>

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
    </div>
  );
}
