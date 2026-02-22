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
    <div className="ui-surface mx-auto flex w-full max-w-xl flex-col items-center justify-center border-dashed px-6 py-14 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary shadow-sm">
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
        <Button size="sm" onClick={onAction} className="mt-5 shadow-sm">
          <IconPlus size={16} />
          {actionLabel}
        </Button>
      )}
      {action}
    </div>
  );
}
