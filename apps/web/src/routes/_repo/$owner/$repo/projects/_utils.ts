import { useCallback } from "react";
import { useLocalStorage } from "usehooks-ts";
import type { ProjectPhase } from "@/lib/components/projects/ProjectPhaseBadge";

type ProjectView = "kanban" | "timeline" | "list" | "table";
export const SORT_FIELDS = ["created", "title", "priority"] as const;
type SortField = (typeof SORT_FIELDS)[number];
type SortDir = "asc" | "desc";

interface ProjectFilters {
  q: string;
  view: ProjectView;
  // Phases the user has hidden (blocklist). Empty = all phases visible.
  // Storing exclusions (not the visible allowlist) keeps "no filter" stable
  // and makes any newly-added phase visible by default.
  hiddenPhases: ProjectPhase[];
  sortField: SortField;
  sortDir: SortDir;
}

const DEFAULTS: ProjectFilters = {
  q: "",
  view: "kanban",
  hiddenPhases: [],
  sortField: "created",
  sortDir: "desc",
};

// Bumped from "project-filters": the old shape persisted a visible-phase
// allowlist, which left newly-added phases stuck off for existing users.
const STORAGE_KEY = "project-filters-v2";

export type { ProjectView, SortField, SortDir, ProjectFilters };

export function useProjectFilters(): [
  ProjectFilters,
  (patch: Partial<ProjectFilters>) => void,
] {
  const [filters, setFilters] = useLocalStorage<ProjectFilters>(
    STORAGE_KEY,
    DEFAULTS,
  );

  const setParams = useCallback(
    (patch: Partial<ProjectFilters>) => {
      setFilters((prev) => ({ ...prev, ...patch }));
    },
    [setFilters],
  );

  return [filters, setParams];
}
