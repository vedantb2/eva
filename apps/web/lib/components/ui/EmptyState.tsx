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
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-muted mb-5">
        {icon}
      </div>
      <p className="text-lg font-semibold text-foreground">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction} className="mt-4">
          <IconPlus size={16} />
          {actionLabel}
        </Button>
      )}
      {action}
    </div>
  );
}
