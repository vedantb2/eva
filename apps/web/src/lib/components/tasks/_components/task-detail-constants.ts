export const NO_PROJECT_VALUE = "__none__";
export const UNASSIGNED_VALUE = "__unassigned__";

export const GHOST_TRIGGER_CLASS =
  "h-10 border-0 shadow-none bg-transparent px-2 focus:ring-0 focus:ring-offset-0 hover:bg-muted/60 rounded-md text-[13px] [&>svg:last-child]:hidden";

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
}): string {
  if (user.fullName) {
    return user.fullName;
  }
  const parts = [user.firstName, user.lastName].filter(
    (p): p is string => typeof p === "string" && p.length > 0,
  );
  if (parts.length > 0) {
    return parts.join(" ");
  }
  return "Unnamed User";
}

export type TaskDetailTab = "activity" | "proof" | "audit" | "comments";

export const TASK_DETAIL_TABS = [
  "activity",
  "proof",
  "audit",
  "comments",
] as const;

export function isTaskDetailTab(v: string): v is TaskDetailTab {
  return (TASK_DETAIL_TABS as readonly string[]).includes(v);
}
