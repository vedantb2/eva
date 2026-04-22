import { useCallback } from "react";
import { useLocalStorage } from "usehooks-ts";
import {
  TASK_STATUSES,
  type DisplayTaskStatus,
} from "@/lib/components/tasks/TaskStatusBadge";

type QuickTaskView = "kanban" | "list" | "table";
type SortField = "lastRun" | "updated" | "created" | "title";
type SortDir = "asc" | "desc";
type TimeRange = "7d" | "30d" | "90d" | "all";

interface QuickTaskFilters {
  q: string;
  view: QuickTaskView;
  project: string;
  user: string;
  assignee: string;
  tags: string[];
  sortField: SortField;
  sortDir: SortDir;
  timeRange: TimeRange;
  statuses: DisplayTaskStatus[];
}

const DEFAULTS: QuickTaskFilters = {
  q: "",
  view: "kanban",
  project: "none",
  user: "all",
  assignee: "all",
  tags: [],
  sortField: "lastRun",
  sortDir: "desc",
  timeRange: "all",
  statuses: [...TASK_STATUSES],
};

const STORAGE_KEY = "quick-task-filters";

export function useQuickTaskFilters(): [
  QuickTaskFilters,
  (patch: Partial<QuickTaskFilters>) => void,
] {
  const [filters, setFilters] = useLocalStorage<QuickTaskFilters>(
    STORAGE_KEY,
    DEFAULTS,
  );

  const setParams = useCallback(
    (patch: Partial<QuickTaskFilters>) => {
      setFilters((prev) => ({ ...prev, ...patch }));
    },
    [setFilters],
  );

  return [filters, setParams];
}
