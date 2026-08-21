"use client";

import { RepoSectionBreadcrumb } from "@/lib/components/RepoSectionBreadcrumb";

interface QuickTaskBreadcrumbProps {
  onBack: () => void;
  taskNumId?: number;
}

/** Breadcrumb shows only the task number: the title is rendered by TaskHeader below. */
export function QuickTaskBreadcrumb({
  onBack,
  taskNumId,
}: QuickTaskBreadcrumbProps) {
  if (taskNumId === undefined) {
    return null;
  }

  return (
    <RepoSectionBreadcrumb
      sectionLabel="Quick Tasks"
      onSectionClick={onBack}
      entityLabel={`#${taskNumId}`}
    />
  );
}
