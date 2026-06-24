import type { TaskStatus } from "../TaskStatusBadge";

export const NO_PROJECT_VALUE = "__none__";
export const NEW_PROJECT_VALUE = "__new_project__";
export const UNASSIGNED_VALUE = "__unassigned__";
export const NO_PRIORITY_VALUE = "__no_priority__";
export const SCREENSHOTS_INHERIT_VALUE = "__inherit__";
export const SCREENSHOTS_ON_VALUE = "__on__";
export const SCREENSHOTS_OFF_VALUE = "__off__";

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
  building: { iconColor: "text-amber-500 animate-pulse", label: "Building" },
  error: { iconColor: "text-red-500", label: "Deploy failed" },
  queued: { iconColor: "text-blue-500 animate-pulse", label: "Queued" },
};

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

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

export type TaskDetailTab = "activity" | "proof" | "audit";

export const TASK_DETAIL_TABS = ["activity", "proof", "audit"] as const;

export function isTaskDetailTab(v: string): v is TaskDetailTab {
  return (TASK_DETAIL_TABS as readonly string[]).includes(v);
}

/**
 * Compact tabs for Activity / Proof / Audit on task detail.
 * Radius comes from the shared Tabs primitives (`rounded-lg` → `--radius`).
 * `tabs-segmented` (defined in globals.css) drives the trough + active-pill
 * fills per mode, so the active pill stays lighter/raised in both light and
 * dark. Inactive labels use muted-foreground so they read as dimmed.
 */
export const TASK_DETAIL_TAB_LIST_CLASS =
  "sticky top-0 z-10 h-auto w-fit gap-0.5 border border-border p-1 shadow-none tabs-segmented";

export const TASK_DETAIL_TAB_TRIGGER_CLASS =
  "gap-1 px-3 py-1.5 text-xs font-medium sm:gap-1.5 sm:text-sm transition-[color,background-color] data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted data-[state=inactive]:hover:text-foreground";
