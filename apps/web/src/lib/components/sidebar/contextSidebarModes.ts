/**
 * Shared context-sidebar mode type + the nav-name → mode lookup.
 * Extracted so both `Sidebar` and `RepoNavSections` can reference them
 * without creating an import cycle between the two components.
 */

export type ContextSidebarMode =
  | "main"
  | "designs"
  | "sessions"
  | "settings"
  | "docs"
  | "reviews"
  | "testing-arena"
  | "automations";

/** Nav items whose click swaps the whole sidebar into a focused drill-down view. */
const CONTEXT_SIDEBAR_BY_NAV_NAME = new Map<string, ContextSidebarMode>([
  ["Designs", "designs"],
  ["Sessions", "sessions"],
  ["Settings", "settings"],
  ["Documents", "docs"],
  ["Reviews", "reviews"],
  ["Testing Arena", "testing-arena"],
  ["Automations", "automations"],
]);

/** Resolves the drill-down mode for a nav item name, or undefined for plain links. */
export function contextSidebarModeForNav(
  navName: string,
): ContextSidebarMode | undefined {
  return CONTEXT_SIDEBAR_BY_NAV_NAME.get(navName);
}
