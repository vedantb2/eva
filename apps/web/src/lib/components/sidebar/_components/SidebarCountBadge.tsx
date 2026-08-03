import { Badge } from "@eva/ui";

interface SidebarCountBadgeProps {
  /** Raw count; anything above 99 renders as "99+". */
  count: number;
}

/**
 * Trailing count pill on a sidebar nav row (drafts, unread automations, …).
 *
 * Quiet by design: a neutral tonal fill and muted text, never a coloured
 * badge — a sidebar row is not where an accent moment belongs.
 */
export function SidebarCountBadge({ count }: SidebarCountBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className="ml-auto border-none bg-sidebar-accent/50 px-1.5 py-0.5"
    >
      <span className="text-2xs font-medium text-muted-foreground">
        {count > 99 ? "99+" : count}
      </span>
    </Badge>
  );
}
