"use client";

import { useState } from "react";
import { cn } from "@eva/ui";
import type { Id } from "@eva/backend";
import { MarkdownEditor } from "@/lib/components/tasks/_components/MarkdownEditor";
import { useUpdateProject } from "./useUpdateProject";

export function ProjectDescription({
  description,
  projectId,
  className,
  clamp = true,
}: {
  description: string | undefined;
  projectId: Id<"projects">;
  /** Overrides the wrapper padding (the task rail needs it, Overview does not). */
  className?: string;
  /** Rail height cap. Off on Overview, where the description owns the column. */
  clamp?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const updateProject = useUpdateProject(projectId);

  const desc = description ?? "";

  const handleSave = (markdown: string) => {
    const trimmed = markdown.trim();
    if (trimmed !== desc) {
      updateProject({ id: projectId, description: trimmed });
    }
    setIsEditing(false);
  };

  const handleClick = () => {
    if (!isEditing) setIsEditing(true);
  };

  return (
    <div className={cn("px-3 pt-3 pb-2", className)}>
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1">
        Project context
      </div>
      <div
        onClick={handleClick}
        title={
          isEditing
            ? undefined
            : "Acts as the project's system prompt for Eva chat and tasks"
        }
        className={cn(
          "min-h-6 overflow-x-hidden rounded px-2 py-1 -mx-2 -my-1",
          !isEditing && "cursor-pointer hover:bg-muted/50",
          !isEditing && clamp && "max-h-[20vh] overflow-y-auto scrollbar",
        )}
      >
        <MarkdownEditor
          content={desc}
          editable={isEditing}
          placeholder="Click to add project context (used as system prompt for Eva chat and tasks)..."
          onBlur={handleSave}
          className="text-sm text-muted-foreground"
        />
      </div>
    </div>
  );
}
