"use client";

import { IconDatabase, IconPlus } from "@tabler/icons-react";

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
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Icon size={24} className="text-neutral-400 mb-2" />
      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {title}
      </p>
      {description && (
        <p className="text-xs text-neutral-500 mt-1">{description}</p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-1 mt-3 text-sm text-primary hover:text-primary/80"
        >
          <IconPlus size={14} />
          <span>{actionLabel}</span>
        </button>
      )}
      {action}
    </div>
  );
}
