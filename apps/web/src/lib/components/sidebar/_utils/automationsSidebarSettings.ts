import type { AppSortOrder } from "./sessionsSidebarSettings";

/** Per-app expand/collapse in the global Automations sidebar. */
export const AUTOMATIONS_APP_GROUPS_OPEN_KEY =
  "eva:automations-app-groups-open:v1";

/** localStorage key for Automations sidebar sort / preview prefs. */
export const AUTOMATIONS_SIDEBAR_SETTINGS_KEY =
  "eva:automations-sidebar-settings:v1";

/**
 * Same two orders the Sessions sidebar offers for its rows, so the value is
 * interchangeable with `sortSessionsForSidebar`.
 */
export const AUTOMATION_SORT_ORDERS = ["created_at", "updated_at"] as const;
export type AutomationSortOrder = (typeof AUTOMATION_SORT_ORDERS)[number];

/**
 * Labels differ from the Sessions ones: an automation has no user messages, so
 * `updated_at` reads as its last change rather than a last message.
 */
export const AUTOMATION_APP_SORT_LABELS: Record<AppSortOrder, string> = {
  manual: "App order",
  created_at: "Created at",
  updated_at: "Last activity",
};

export const AUTOMATION_SORT_LABELS: Record<AutomationSortOrder, string> = {
  created_at: "Created at",
  updated_at: "Last activity",
};

export interface AutomationsSidebarSettings {
  appSortOrder: AppSortOrder;
  automationSortOrder: AutomationSortOrder;
  automationPreviewCount: number;
}

/**
 * Apps follow the rail's order and automations their creation date, so neither
 * list reshuffles itself when a run lands.
 */
export const DEFAULT_AUTOMATIONS_SIDEBAR_SETTINGS: AutomationsSidebarSettings =
  {
    appSortOrder: "manual",
    automationSortOrder: "created_at",
    automationPreviewCount: 3,
  };

export function isAutomationSortOrder(
  value: string,
): value is AutomationSortOrder {
  for (const order of AUTOMATION_SORT_ORDERS) {
    if (order === value) return true;
  }
  return false;
}
