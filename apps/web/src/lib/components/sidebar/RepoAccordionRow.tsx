"use client";

import type { ReactNode } from "react";
import { IconChevronDown } from "@tabler/icons-react";
import { Tooltip, TooltipContent, TooltipTrigger, cn } from "@conductor/ui";
import { RepoLogo } from "@/lib/components/RepoLogo";

interface RepoAccordionRowProps {
  label: string;
  logoUrl?: string | null;
  fallbackIcon: ReactNode;
  active: boolean;
  /** Whether this codebase is the active one (parent row shows a chevron). */
  expandable?: boolean;
  expanded?: boolean;
  /** App rows sit indented under their parent codebase. */
  indent?: boolean;
  onClick: () => void;
}

/**
 * A single repo/app row in the sidebar repo accordion. Active rows get the
 * HeroUI surface-fill + border chip; inactive rows keep a transparent border to
 * avoid layout shift.
 */
export function RepoAccordionRow({
  label,
  logoUrl,
  fallbackIcon,
  active,
  expandable = false,
  expanded = false,
  indent = false,
  onClick,
}: RepoAccordionRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring/35",
        indent && "py-1",
        active
          ? "border-border bg-sidebar-accent font-medium text-sidebar-primary"
          : cn(
              "border-transparent hover:bg-sidebar-accent/50",
              expanded && expandable
                ? "text-sidebar-primary"
                : "text-sidebar-foreground/80 hover:text-sidebar-foreground",
            ),
      )}
    >
      <RepoLogo
        logoUrl={logoUrl}
        size={indent ? 16 : 20}
        fallback={fallbackIcon}
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="min-w-0 flex-1 truncate">{label}</span>
        </TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
      {expandable && (
        <IconChevronDown
          size={14}
          className={cn(
            "shrink-0 text-muted-foreground transition-transform duration-200",
            !expanded && "-rotate-90",
          )}
        />
      )}
    </button>
  );
}
