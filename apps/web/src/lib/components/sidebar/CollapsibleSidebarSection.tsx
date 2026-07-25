"use client";

import { cn } from "@eva/ui";
import { IconChevronDown } from "@tabler/icons-react";
import type { ReactNode } from "react";

interface CollapsibleSidebarSectionProps {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  itemsClassName?: string;
  showHeader?: boolean;
}

export function CollapsibleSidebarSection({
  label,
  open,
  onToggle,
  children,
  itemsClassName,
  showHeader = true,
}: CollapsibleSidebarSectionProps) {
  if (!showHeader) {
    return <div className={cn("space-y-1", itemsClassName)}>{children}</div>;
  }

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-1.5 px-1 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/55 transition-colors hover:text-muted-foreground/80"
      >
        <span>{label}</span>
        <IconChevronDown
          size={12}
          className={cn(
            "shrink-0 text-muted-foreground/55 transition-transform duration-200",
            !open && "-rotate-90",
          )}
        />
      </button>
      {open ? (
        <div className={cn("space-y-1 pl-2", itemsClassName)}>{children}</div>
      ) : null}
    </div>
  );
}
