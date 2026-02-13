"use client";

import { IconPlus } from "@tabler/icons-react";
import { Button } from "@conductor/ui";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary shadow-xs">
        {icon}
      </div>
      <p className="text-base font-semibold tracking-[-0.01em] text-foreground">
        {title}
      </p>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction} className="mt-5">
          <IconPlus size={16} />
          {actionLabel}
        </Button>
      )}
      {action}
    </div>
  );
}
