import { useCallback } from "react";
import { useLocalStorage } from "usehooks-ts";
import {
  PROJECT_PHASES,
  type ProjectPhase,
} from "@/lib/components/projects/ProjectPhaseBadge";

type ProjectView = "kanban" | "timeline" | "list" | "table";
type SortField = "created" | "title";
type SortDir = "asc" | "desc";

interface ProjectFilters {
  q: string;
  view: ProjectView;
  phases: ProjectPhase[];
  sortField: SortField;
  sortDir: SortDir;
}

const DEFAULTS: ProjectFilters = {
  q: "",
  view: "kanban",
  phases: [...PROJECT_PHASES],
  sortField: "created",
  sortDir: "desc",
};

const STORAGE_KEY = "project-filters";

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
