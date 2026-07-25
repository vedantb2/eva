import { useLocalStorage } from "usehooks-ts";
import type { ProjectPhase } from "@/lib/components/projects/ProjectPhaseBadge";

type ProjectView = "kanban" | "timeline" | "list" | "table";
export const SORT_FIELDS = ["created", "title", "priority"] as const;
type SortField = (typeof SORT_FIELDS)[number];
type SortDir = "asc" | "desc";
// Timeline axis granularity. Maps 1:1 to the Gantt engine's `Range`
// ("daily" renders day columns, surfaced to users as the "Week" zoom).
type TimelineRange = "quarterly" | "monthly" | "daily";

interface ProjectFilters {
  q: string;
  view: ProjectView;
  // Phases the user has hidden (blocklist). Empty = all phases visible.
  // Storing exclusions (not the visible allowlist) keeps "no filter" stable
  // and makes any newly-added phase visible by default.
  hiddenPhases: ProjectPhase[];
  sortField: SortField;
  sortDir: SortDir;
  // Timeline view only: axis granularity + zoom (percent). Other views ignore.
  timelineRange: TimelineRange;
  timelineZoom: number;
}

const DEFAULTS: ProjectFilters = {
  q: "",
  view: "kanban",
  hiddenPhases: [],
  sortField: "created",
  sortDir: "desc",
  // Weekly grid by default, matching Linear's default timeline zoom.
  timelineRange: "daily",
  timelineZoom: 100,
};

// Bumped from "project-filters": the old shape persisted a visible-phase
// allowlist, which left newly-added phases stuck off for existing users.
const STORAGE_KEY = "project-filters-v2";

export type { ProjectView, SortField, SortDir, TimelineRange, ProjectFilters };

export function useProjectFilters(): [
  ProjectFilters,
  (patch: Partial<ProjectFilters>) => void,
] {
  const [filters, setFilters] = useLocalStorage<ProjectFilters>(
    STORAGE_KEY,
    DEFAULTS,
  );

  const setParams = (patch: Partial<ProjectFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  // Merge defaults on read so objects persisted before new keys existed
  // (e.g. timelineRange/timelineZoom) backfill without a STORAGE_KEY bump.
  return [{ ...DEFAULTS, ...filters }, setParams];
}
