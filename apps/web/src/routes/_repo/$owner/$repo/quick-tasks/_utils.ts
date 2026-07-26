import { useLocalStorage } from "usehooks-ts";
import { useQueryStates } from "nuqs";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@eva/backend";
import {
  TASK_STATUSES,
  type DisplayTaskStatus,
} from "@/lib/components/tasks/TaskStatusBadge";
import { priorityCompare } from "@/lib/components/priority/priorityMeta";
import {
  searchParser,
  sortDirParser,
  statusesParser,
  quickTaskSortFieldParser,
  quickTaskTimeRangeParser,
  quickTaskProjectParser,
  quickTaskUserParser,
  quickTaskAssigneeParser,
  quickTaskTagsParser,
} from "@/lib/search-params";

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

// Per-user presentation preference — kept in localStorage. Everything else
// (search, filters, sort) is shareable "what you're looking at" state that
// lives in the URL via nuqs — see the parsers below.
interface QuickTaskLocalFilters {
  view: QuickTaskView;
}

const LOCAL_DEFAULTS: QuickTaskLocalFilters = {
  view: "kanban",
};

// v2: product default sort flipped lastRun → updated; bump key so existing
// localStorage does not keep the old default sticky for returning users.
// Persisted objects from before the URL-state split still carry the old
// filter fields (q, project, tags, …) — harmless, we only ever read `view`.
const STORAGE_KEY = "quick-task-filters-v2";

export function useQuickTaskFilters(): [
  QuickTaskFilters,
  (patch: Partial<QuickTaskFilters>) => void,
] {
  const [localFilters, setLocalFilters] =
    useLocalStorage<QuickTaskLocalFilters>(STORAGE_KEY, LOCAL_DEFAULTS);

  const [urlFilters, setUrlFilters] = useQueryStates({
    q: searchParser,
    project: quickTaskProjectParser,
    user: quickTaskUserParser,
    assignee: quickTaskAssigneeParser,
    tags: quickTaskTagsParser,
    sortField: quickTaskSortFieldParser,
    sortDir: sortDirParser,
    timeRange: quickTaskTimeRangeParser,
    statuses: statusesParser,
  });

  // Merge defaults on read so objects persisted before the URL-state split
  // (or missing `view` entirely) backfill without a STORAGE_KEY bump.
  const filters: QuickTaskFilters = {
    ...LOCAL_DEFAULTS,
    ...localFilters,
    ...urlFilters,
  };

  const setParams = (patch: Partial<QuickTaskFilters>) => {
    const { view, ...urlPatch } = patch;
    if (view !== undefined) {
      setLocalFilters((prev) => ({ ...prev, view }));
    }
    if (Object.keys(urlPatch).length > 0) {
      void setUrlFilters(urlPatch);
    }
  };

  return [filters, setParams];
}

type QuickTask = FunctionReturnType<typeof api.agentTasks.getAllTasks>[number];

function applyQuickTaskFilters(
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
function groupByStatusOrder(tasks: QuickTask[]): QuickTask[] {
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
