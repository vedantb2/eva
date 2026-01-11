"use client";

import { IconAlertCircle, IconRefresh } from "@tabler/icons-react";

interface ErrorStateProps {
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  showIcon?: boolean;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  actionLabel = "Try again",
  onAction,
  showIcon = true,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center ${className}`}
    >
      {showIcon && (
        <div className="p-4 rounded-full mb-4 bg-red-50 dark:bg-red-900/20">
          <IconAlertCircle size={32} color="#dc2626" />
        </div>
      )}

      <h3 className="text-lg font-dmSans-semibold text-neutral-900 dark:text-neutral-100 mb-2">
        {title}
      </h3>

      <p className="text-sm font-dmSans-medium text-neutral-600 dark:text-neutral-400 mb-6 max-w-sm">
        {message}
      </p>

      {onAction && (
        <button
          onClick={onAction}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-dmSans-medium text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors duration-200"
        >
          <IconRefresh size={16} />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}
