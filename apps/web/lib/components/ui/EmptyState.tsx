"use client";

import { IconDatabase, IconPlus } from "@tabler/icons-react";
import { Button } from "@conductor/ui";

interface EmptyStateProps {
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: React.ReactNode;
}

export function EmptyState({
  icon: Icon = IconDatabase,
  title,
  description,
  actionLabel,
  onAction,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary mb-4">
        <Icon size={24} className="text-muted-foreground" />
      </div>
      <p className="text-base font-medium text-foreground">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground mt-1.5 max-w-xs">
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
