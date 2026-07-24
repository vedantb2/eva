import { useLocalStorage } from "usehooks-ts";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@conductor/backend";
import {
  TASK_STATUSES,
  type DisplayTaskStatus,
} from "@/lib/components/tasks/TaskStatusBadge";
import { priorityCompare } from "@/lib/components/priority/priorityMeta";

type QuickTaskView = "kanban" | "list" | "table";
type SortField = "lastRun" | "updated" | "created" | "title" | "priority";
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
  // Default to updatedAt so any task change (edits, activity, status) bubbles
  // the card to the top of its kanban column — not only agent runs.
  sortField: "updated",
  sortDir: "desc",
  timeRange: "all",
  statuses: [...TASK_STATUSES],
};

// v2: product default sort flipped lastRun → updated; bump key so existing
// localStorage does not keep the old default sticky for returning users.
const STORAGE_KEY = "quick-task-filters-v2";

export function useQuickTaskFilters(): [
  QuickTaskFilters,
  (patch: Partial<QuickTaskFilters>) => void,
] {
  const [filters, setFilters] = useLocalStorage<QuickTaskFilters>(
    STORAGE_KEY,
    DEFAULTS,
  );

  const setParams = (patch: Partial<QuickTaskFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  return [filters, setParams];
}

type QuickTask = FunctionReturnType<typeof api.agentTasks.getAllTasks>[number];

export function applyQuickTaskFilters(
  tasks: QuickTask[],
  filters: QuickTaskFilters,
): QuickTask[] {
  let filtered = tasks;

  if (filters.q.trim()) {
    const query = filters.q.trim().toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.title.toLowerCase().includes(query) ||
        (t.description && t.description.toLowerCase().includes(query)),
    );
  }

  if (filters.project !== "all") {
    filtered =
      filters.project === "none"
        ? filtered.filter((t) => !t.projectId)
        : filtered.filter((t) => t.projectId === filters.project);
  }

  if (filters.user !== "all") {
    filtered = filtered.filter((t) => t.createdBy === filters.user);
  }

  if (filters.assignee !== "all") {
    filtered =
      filters.assignee === "unassigned"
        ? filtered.filter((t) => !t.assignedTo)
        : filtered.filter((t) => t.assignedTo === filters.assignee);
  }

  const statusSet = new Set<string>(filters.statuses);
  filtered = filtered.filter(
    (t) => t.status !== "draft" && statusSet.has(t.status),
  );

  if (filters.tags.length > 0) {
    const tagSet = new Set(filters.tags);
    filtered = filtered.filter(
      (t) => t.tags && t.tags.some((tag) => tagSet.has(tag)),
    );
  }

  if (filters.timeRange !== "all") {
    const now = Date.now();
    const msMap: Record<string, number> = {
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
      "90d": 90 * 24 * 60 * 60 * 1000,
    };
    const cutoff = now - (msMap[filters.timeRange] ?? 0);
    filtered = filtered.filter((t) => t.createdAt >= cutoff);
  }

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (filters.sortField === "lastRun") {
      // Fall back to createdAt so tasks that have never run are sorted by
      // creation time rather than collapsing to 0 and sinking to the bottom.
      const aTime = a.lastRunStartedAt ?? a.createdAt;
      const bTime = b.lastRunStartedAt ?? b.createdAt;
      cmp = aTime - bTime;
    } else if (filters.sortField === "updated") {
      cmp = a.updatedAt - b.updatedAt;
    } else if (filters.sortField === "created") {
      cmp = a.createdAt - b.createdAt;
    } else if (filters.sortField === "title") {
      cmp = a.title.localeCompare(b.title);
    } else if (filters.sortField === "priority") {
      cmp = priorityCompare(a.priority, b.priority);
    }
    return filters.sortDir === "asc" ? cmp : -cmp;
  });

  return sorted;
}

// Regroup an already-sorted array into kanban order: tasks bucketed by status
// in TASK_STATUSES order, preserving the input array's relative order within
// each bucket. Used so prev/next on the detail page matches the kanban's
// visual top-to-bottom-then-rightward flow.
export function groupByStatusOrder(tasks: QuickTask[]): QuickTask[] {
  const byStatus = new Map<string, QuickTask[]>();
  for (const task of tasks) {
    const list = byStatus.get(task.status) ?? [];
    list.push(task);
    byStatus.set(task.status, list);
  }
  const result: QuickTask[] = [];
  for (const status of TASK_STATUSES) {
    const group = byStatus.get(status);
    if (group) result.push(...group);
  }
  return result;
}

export function useFilteredQuickTasks(
  tasks: QuickTask[] | undefined,
  options?: { groupByStatus?: boolean },
): QuickTask[] {
  const [filters] = useQuickTaskFilters();
  const groupByStatus = options?.groupByStatus ?? false;
  const sorted = applyQuickTaskFilters(tasks ?? [], filters);
  return groupByStatus ? groupByStatusOrder(sorted) : sorted;
}
