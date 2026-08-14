"use client";

import { RepoSectionBreadcrumb } from "@/lib/components/RepoSectionBreadcrumb";

interface QuickTaskBreadcrumbProps {
  onBack: () => void;
  taskNumId?: number;
  taskTitle?: string;
}

export function QuickTaskBreadcrumb({
  onBack,
  taskNumId,
  taskTitle,
}: QuickTaskBreadcrumbProps) {
  const taskLabel = (() => {
    if (taskTitle) {
      return taskNumId !== undefined
        ? `#${taskNumId} ${taskTitle}`
        : taskTitle;
    }
    if (taskNumId !== undefined) return `#${taskNumId}`;
    return "";
  })();

  if (taskLabel.length === 0) {
    return null;
  }

  return (
    <RepoSectionBreadcrumb
      sectionLabel="Quick Tasks"
      onSectionClick={onBack}
      entityLabel={taskLabel}
    />
  );
}
