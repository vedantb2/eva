import type { FunctionReturnType } from "convex/server";
import type { Id, api } from "@eva/backend";
import { m, AnimatePresence } from "motion/react";
import { ProjectsTimeline } from "@/lib/components/projects/ProjectsTimeline";
import { ProjectsListView } from "@/lib/components/projects/ProjectsListView";
import type { ProjectPhase } from "@/lib/components/projects/ProjectPhaseBadge";
import { ProjectsKanbanView } from "./ProjectsKanbanView";
import type { ProjectFilters, ProjectView } from "../_utils";

type Project = FunctionReturnType<typeof api.projects.list>[number];

interface ProjectsViewSwitcherProps {
  view: ProjectView;
  filteredSorted: Project[];
  projectsByPhase: Record<ProjectPhase, Project[]>;
  visiblePhases: Set<ProjectPhase>;
  owner: string;
  name: string;
  basePath: string;
  onDelete: (id: Id<"projects">, title: string) => void;
  timelineRange: ProjectFilters["timelineRange"];
  timelineZoom: ProjectFilters["timelineZoom"];
  onTimelineRangeChange: (range: ProjectFilters["timelineRange"]) => void;
  onTimelineZoomChange: (zoom: ProjectFilters["timelineZoom"]) => void;
}

/**
 * Swaps between the kanban, timeline, and list presentations of the same
 * filtered/sorted project set, with the shared cross-fade + slide transition.
 */
export function ProjectsViewSwitcher({
  view,
  filteredSorted,
  projectsByPhase,
  visiblePhases,
  owner,
  name,
  basePath,
  onDelete,
  timelineRange,
  timelineZoom,
  onTimelineRangeChange,
  onTimelineZoomChange,
}: ProjectsViewSwitcherProps) {
  return (
    <AnimatePresence initial={false} mode="wait">
      {view === "kanban" ? (
        <m.div
          key="projects-kanban-view"
          className="flex min-h-0 min-w-0 flex-1 flex-col"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex h-full min-h-0 min-w-0 flex-1 items-stretch gap-2 overflow-x-auto overflow-y-hidden scrollbar scroll-fade-x snap-x snap-mandatory sm:gap-3 sm:snap-none">
            <ProjectsKanbanView
              projectsByPhase={projectsByPhase}
              visiblePhases={visiblePhases}
              owner={owner}
              name={name}
              basePath={basePath}
              onDelete={onDelete}
            />
          </div>
        </m.div>
      ) : view === "timeline" ? (
        <m.div
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
            range={timelineRange}
            zoom={timelineZoom}
            onRangeChange={onTimelineRangeChange}
            onZoomChange={onTimelineZoomChange}
          />
        </m.div>
      ) : (
        <m.div
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
            onDelete={onDelete}
          />
        </m.div>
      )}
    </AnimatePresence>
  );
}
