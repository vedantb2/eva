"use client";

import { Badge, Button, CollapsibleTrigger, StatusDot, cn } from "@eva/ui";
import { IconChevronDown, IconPlus } from "@tabler/icons-react";
import { RepoLogo } from "@/lib/components/RepoLogo";
import type { SessionListMode } from "@/lib/components/sidebar/_utils/sessionsSidebarSettings";

interface GlobalSessionGroupHeaderProps {
  /** App name shown on the row. */
  label: string;
  logoUrl?: string | null;
  open: boolean;
  listMode: SessionListMode;
  /** Sessions currently running in this app; hidden in the archived list. */
  runningCount: number;
  /** Opens this app's session composer. Omitted in the archived list. */
  onNewSession: () => void;
}

/**
 * Header row of one app group in the global Sessions sidebar: logo, name, a
 * quiet running count, the disclosure chevron, and `+` for a new session.
 *
 * Sits inside the group's `Collapsible`, so the trigger reads the open state
 * from context rather than owning it.
 */
export function GlobalSessionGroupHeader({
  label,
  logoUrl,
  open,
  listMode,
  runningCount,
  onNewSession,
}: GlobalSessionGroupHeaderProps) {
  return (
    <div className="flex items-center gap-0.5 px-1">
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="h-auto min-w-0 flex-1 justify-start gap-2 rounded-menu-item px-2 py-1.5 text-left font-normal hover:bg-sidebar-accent/50 [&_svg]:size-3.5"
        >
          <RepoLogo
            logoUrl={logoUrl}
            size={18}
            fallback={
              <span className="flex size-[18px] items-center justify-center rounded-menu-item border border-border bg-muted text-3xs font-semibold text-muted-foreground">
                {label.charAt(0).toUpperCase()}
              </span>
            }
          />
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-xs font-medium text-muted-foreground">
              {label}
            </span>
            {listMode === "active" && runningCount > 0 ? (
              <Badge
                variant="outline"
                className="shrink-0 gap-1 border-border bg-transparent px-1.5 py-0"
              >
                <StatusDot tone="active" />
                <span className="text-2xs font-medium tabular-nums text-muted-foreground">
                  {runningCount}
                </span>
              </Badge>
            ) : null}
            <IconChevronDown
              className={cn(
                "shrink-0 text-muted-foreground transition-transform duration-200",
                !open && "-rotate-90",
              )}
            />
          </span>
        </Button>
      </CollapsibleTrigger>
      {listMode === "active" ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={`New session in ${label}`}
          title={`New session in ${label}`}
          className="shrink-0 rounded-menu-item text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onNewSession();
          }}
        >
          <IconPlus />
        </Button>
      ) : null}
    </div>
  );
}
