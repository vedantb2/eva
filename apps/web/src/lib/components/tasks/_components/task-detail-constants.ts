import type { TaskStatus } from "../TaskStatusBadge";

export const NO_PROJECT_VALUE = "__none__";
export const NEW_PROJECT_VALUE = "__new_project__";
export const UNASSIGNED_VALUE = "__unassigned__";
export const NO_PRIORITY_VALUE = "__no_priority__";

/** Model can change on any active task; only terminal statuses lock it. */
export function canEditTaskModel(status: TaskStatus | undefined): boolean {
  return status !== "done" && status !== "cancelled";
}

export const GHOST_TRIGGER_CLASS =
  "h-10 border-0 shadow-none bg-transparent px-2 focus:ring-0 focus:ring-offset-0 hover:bg-muted/60 rounded-lg text-[13px] [&>svg:last-child]:hidden";

export const DEPLOYMENT_STATUS_CONFIG: Record<
  string,
  { iconColor: string; label: string }
> = {
  deployed: { iconColor: "text-emerald-500", label: "Deployed" },
  building: { iconColor: "text-amber-500", label: "Building" },
  error: { iconColor: "text-red-500", label: "Deploy failed" },
  queued: { iconColor: "text-blue-500", label: "Queued" },
};

export function getUserDisplayName(user: {
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}): string {
  if (user.fullName?.trim()) {
    return user.fullName.trim();
  }
  const parts = [user.firstName, user.lastName].filter(
    (p): p is string => typeof p === "string" && p.length > 0,
  );
  if (parts.length > 0) {
    return parts.join(" ");
  }
  if (user.email?.trim()) {
    return user.email.trim();
  }
  return "Unnamed User";
}

export type TaskDetailTab = "activity";

const TASK_DETAIL_TABS = ["activity"] as const;

export function isTaskDetailTab(v: string): v is TaskDetailTab {
  return TASK_DETAIL_TABS.some((tab) => tab === v);
}

/**
 * Segmented-tab styling, still used by the marketing landing mock
 * (`LandingTaskDetailMock`). `tabs-segmented` (globals.css) drives the trough +
 * active-pill fills; inactive labels use muted-foreground so they read dimmed.
 */
export const TASK_DETAIL_TAB_LIST_CLASS =
  "sticky top-0 z-10 h-auto w-fit gap-0.5 border border-border p-1 shadow-none tabs-segmented";

export const TASK_DETAIL_TAB_TRIGGER_CLASS =
  "gap-1 px-3 py-1.5 text-xs font-medium sm:gap-1.5 sm:text-sm transition-[color,background-color] data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted data-[state=inactive]:hover:text-foreground";
