/**
 * Geometry and tone for a tile in the far-left rail.
 *
 * Lives in its own module rather than in RepoRail so the rail's own children
 * (settings gear, account menu) can sit on the same 44px square without
 * importing back into their parent.
 */
export const RAIL_TILE_CLASS =
  "relative flex size-11 items-center justify-center rounded-control border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/35";

/** Selected rail tile = tonal fill; the rest stay dimmed until hovered. */
export function railTileActive(active: boolean): string {
  return active
    ? "border-border bg-sidebar-accent text-sidebar-primary"
    : "border-transparent text-muted-foreground opacity-75 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground hover:opacity-100";
}

/** Inactive rail tile, for controls that never take a selected state. */
export const RAIL_TILE_IDLE_CLASS =
  "border-transparent opacity-75 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground hover:opacity-100";
